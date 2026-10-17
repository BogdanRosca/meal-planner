"""
Unit tests for the Facebook reel import: URL parsing, short-link resolution, yt-dlp mapping, importer and endpoint
"""
from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient
from yt_dlp.utils import DownloadError

from app.main import app
from app.services import facebook_client, recipe_importer
from app.services.source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

client = TestClient(app)

VIDEO_ID = "1234567890123456"

VIDEO_INFO = {
    "title": "1.2K views · 30 reactions | Creamy garlic pasta | Tasty",
    "description": "Creamy garlic pasta\n200g spaghetti\n3 cloves garlic",
    "uploader": "Tasty",
    "thumbnails": [{"url": "https://scontent.example.com/thumb.jpg", "width": 720, "height": 1280}],
    "duration": 58.2,
}

DRAFT = {
    "name": "Creamy Garlic Pasta",
    "category": "dinner",
    "main_ingredients": [{"name": "spaghetti", "quantity": 200, "unit": "g"}],
    "common_ingredients": [],
    "instructions": "1. Boil pasta",
    "prep_time": 20,
    "portions": 2,
    "foto_url": "https://scontent.example.com/thumb.jpg",
    "video_url": f"https://www.facebook.com/watch/?v={VIDEO_ID}",
    "field_flags": {},
    "duplicate_of": None,
    "source": {"platform": "facebook", "video_id": VIDEO_ID, "title": "Creamy garlic pasta",
               "channel": "Tasty", "transcript_used": False},
}


class TestParseReference:
    @pytest.mark.parametrize("url", [
        f"https://www.facebook.com/reel/{VIDEO_ID}",
        f"https://www.facebook.com/reel/{VIDEO_ID}/?mibextid=abc",
        f"https://m.facebook.com/watch/?v={VIDEO_ID}&ref=sharing",
        f"facebook.com/watch?v={VIDEO_ID}",
        f"https://web.facebook.com/reels/{VIDEO_ID}/",
        f"https://www.facebook.com/Tasty/videos/{VIDEO_ID}/",
        f"https://www.facebook.com/Tasty/videos/creamy-pasta/{VIDEO_ID}/",
        f"https://www.facebook.com/video.php?v={VIDEO_ID}",
    ])
    def test_full_urls_give_the_video_id(self, url):
        assert facebook_client.parse_video_id(url) == VIDEO_ID
        assert facebook_client.parse_reference(url) == VIDEO_ID

    @pytest.mark.parametrize("url, expected", [
        ("https://fb.watch/abcDEF123/", "https://fb.watch/abcDEF123/"),
        ("fb.watch/abcDEF123", "https://fb.watch/abcDEF123/"),
        ("https://www.facebook.com/share/r/1AbCdEfGh/", "https://www.facebook.com/share/r/1AbCdEfGh/"),
        ("https://m.facebook.com/share/v/1AbCdEfGh/?mibextid=x", "https://www.facebook.com/share/v/1AbCdEfGh/"),
    ])
    def test_short_links_are_normalised_for_resolving(self, url, expected):
        assert facebook_client.parse_video_id(url) is None
        assert facebook_client.parse_reference(url) == expected

    @pytest.mark.parametrize("url", [
        "", "  ", "ftp://www.facebook.com/reel/1234567890123456",
        "https://www.facebook.com/Tasty",
        "https://www.facebook.com/reel/abc",
        "https://www.facebook.com/watch/?v=12",
        "https://www.facebook.com/Tasty/videos/",
        "https://www.facebook.com/share/p/1AbCdEfGh/",
        "https://fb.watch/",
        "https://notfacebook.com/reel/1234567890123456",
        "https://www.instagram.com/reel/DAbcdEFghiJ/",
    ])
    def test_rejects_invalid_urls(self, url):
        assert facebook_client.parse_reference(url) is None

    def test_canonical_url(self):
        assert facebook_client.canonical_video_url(VIDEO_ID) == f"https://www.facebook.com/watch/?v={VIDEO_ID}"


@patch("app.services.facebook_client.httpx.get")
class TestResolveVideoId:
    def test_numeric_ids_need_no_request(self, mock_get):
        assert facebook_client.resolve_video_id(VIDEO_ID, 4) == VIDEO_ID
        mock_get.assert_not_called()

    def test_follows_the_short_link_redirect(self, mock_get):
        mock_get.return_value = MagicMock(url=httpx.URL(f"https://m.facebook.com/reel/{VIDEO_ID}/?s=1"))

        assert facebook_client.resolve_video_id("https://fb.watch/abcDEF123/", 4) == VIDEO_ID
        assert mock_get.call_args.kwargs["follow_redirects"] is True

    def test_login_wall_is_not_found(self, mock_get):
        mock_get.return_value = MagicMock(url=httpx.URL("https://www.facebook.com/login/?next=%2Fshare%2Fr%2Fx"))

        with pytest.raises(VideoNotFoundError):
            facebook_client.resolve_video_id("https://www.facebook.com/share/r/1AbCdEfGh/", 4)

    def test_timeout(self, mock_get):
        mock_get.side_effect = httpx.ConnectTimeout("slow")

        with pytest.raises(SourceTimeoutError):
            facebook_client.resolve_video_id("https://fb.watch/abcDEF123/", 4)

    def test_connection_error(self, mock_get):
        mock_get.side_effect = httpx.ConnectError("down")

        with pytest.raises(SourceFetchError):
            facebook_client.resolve_video_id("https://fb.watch/abcDEF123/", 4)


def _mock_ydl(mock_ydl_class, info=None, error=None):
    ydl = MagicMock()
    if error:
        ydl.extract_info.side_effect = error
    else:
        ydl.extract_info.return_value = info
    mock_ydl_class.return_value.__enter__.return_value = ydl
    return ydl


@patch("app.services.ytdlp_client.yt_dlp.YoutubeDL")
class TestFetchVideoMetadata:
    def test_maps_video_info(self, mock_ydl_class):
        ydl = _mock_ydl(mock_ydl_class, info=VIDEO_INFO)

        metadata = facebook_client.fetch_video_metadata(VIDEO_ID, 10, cookies_file="/tmp/fb.txt")

        assert metadata == {
            "video_id": VIDEO_ID,
            "title": "Creamy garlic pasta",
            "description": VIDEO_INFO["description"],
            "channel": "Tasty",
            "thumbnail_url": "https://scontent.example.com/thumb.jpg",
            "duration": 58.2,
            "language": None,
        }
        ydl.extract_info.assert_called_once_with(f"https://www.facebook.com/watch/?v={VIDEO_ID}", download=False)
        assert mock_ydl_class.call_args[0][0]["cookiefile"] == "/tmp/fb.txt"

    def test_unparseable_page_is_not_found(self, mock_ydl_class):
        _mock_ydl(mock_ydl_class, error=DownloadError(f"ERROR: [facebook] {VIDEO_ID}: Cannot parse data"))

        with pytest.raises(VideoNotFoundError):
            facebook_client.fetch_video_metadata(VIDEO_ID, 10)

    def test_unavailable_video_is_not_found(self, mock_ydl_class):
        _mock_ydl(mock_ydl_class, error=DownloadError("ERROR: This video is unavailable"))

        with pytest.raises(VideoNotFoundError):
            facebook_client.fetch_video_metadata(VIDEO_ID, 10)


class TestImportFromFacebook:
    @patch.dict("os.environ", {"ANTHROPIC_API_KEY": "key", "FACEBOOK_COOKIES_FILE": ""})
    @patch("app.services.recipe_importer.build_draft")
    @patch("app.services.recipe_importer.call_llm")
    @patch("app.services.recipe_importer.facebook_client.fetch_video_metadata")
    @patch("app.services.recipe_importer.facebook_client.resolve_video_id")
    def test_resolves_then_builds_draft(self, mock_resolve, mock_fetch, mock_llm, mock_build):
        mock_resolve.return_value = VIDEO_ID
        mock_fetch.return_value = {"title": "Creamy garlic pasta", "channel": "Tasty"}
        mock_build.return_value = ({"name": "Creamy Garlic Pasta"}, {})

        draft = recipe_importer.import_from_facebook("https://fb.watch/abcDEF123/")

        mock_resolve.assert_called_once_with("https://fb.watch/abcDEF123/",
                                             recipe_importer.FACEBOOK_RESOLVE_TIMEOUT_SECONDS)
        mock_fetch.assert_called_once_with(VIDEO_ID, recipe_importer.FACEBOOK_TIMEOUT_SECONDS, None)
        assert mock_llm.call_args[0][1] is None
        assert mock_llm.call_args[0][5] == "facebook"
        assert draft["video_url"] == f"https://www.facebook.com/watch/?v={VIDEO_ID}"
        assert draft["source"]["platform"] == "facebook"
        assert draft["source"]["video_id"] == VIDEO_ID

    @patch.dict("os.environ", {"ANTHROPIC_API_KEY": ""})
    def test_requires_anthropic_key(self):
        with pytest.raises(recipe_importer.MissingConfigError):
            recipe_importer.import_from_facebook(VIDEO_ID)


class TestFacebookImportEndpoint:
    @patch("app.routes.recipe_import.DatabaseClient")
    @patch("app.services.recipe_importer.import_from_facebook")
    def test_short_link_import_checks_duplicates_by_resolved_id(self, mock_import, mock_db_class):
        mock_import.return_value = dict(DRAFT)
        db = mock_db_class.return_value
        db.connect.return_value = True
        db.find_recipes_by_video_id.return_value = [
            {"id": 3, "name": "Garlic Pasta", "video_url": f"https://www.facebook.com/reel/{VIDEO_ID}/"},
        ]

        response = client.post("/recipes/import/facebook", json={"url": "https://www.facebook.com/share/r/1AbCdEfGh/"})

        assert response.status_code == 200
        body = response.json()
        assert body["draft"]["source"]["platform"] == "facebook"
        assert body["draft"]["duplicate_of"] == {"id": 3, "name": "Garlic Pasta"}
        mock_import.assert_called_once_with("https://www.facebook.com/share/r/1AbCdEfGh/")
        db.find_recipes_by_video_id.assert_called_once_with(VIDEO_ID)

    def test_rejects_non_facebook_url(self):
        response = client.post("/recipes/import/facebook", json={"url": "https://www.facebook.com/Tasty"})

        assert response.status_code == 422
        assert "Not a valid Facebook reel URL" in response.json()["detail"][0]["msg"]

    @pytest.mark.parametrize("error, status, code", [
        (VideoNotFoundError(VIDEO_ID), 404, "video_not_found"),
        (SourceTimeoutError("slow"), 504, "timeout"),
        (SourceFetchError("429"), 502, "upstream_error"),
    ])
    @patch("app.services.recipe_importer.import_from_facebook")
    def test_maps_errors(self, mock_import, error, status, code):
        mock_import.side_effect = error

        response = client.post("/recipes/import/facebook", json={"url": f"https://www.facebook.com/reel/{VIDEO_ID}"})

        assert response.status_code == status
        assert response.json()["detail"]["code"] == code
