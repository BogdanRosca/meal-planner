"""
Unit tests for the Instagram reel import: URL parsing, yt-dlp mapping, importer and endpoint
"""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from yt_dlp.utils import DownloadError

from app.main import app
from app.services import instagram_client, recipe_importer
from app.services.recipe_extractor import ExtractionError, ExtractionTimeoutError, NotARecipeError
from app.services.source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

client = TestClient(app)

REEL_URL = "https://www.instagram.com/reel/DAbcdEFghiJ/?igsh=abc123"

REEL_INFO = {
    "title": "Video by chef_anna",
    "description": "Creamy garlic pasta 🍝\n\n200g spaghetti\n3 cloves garlic\nSalt to taste",
    "uploader": "Anna Cooks",
    "thumbnails": [
        {"url": "https://cdn.example.com/small.jpg", "width": 320, "height": 568},
        {"url": "https://cdn.example.com/large.jpg", "width": 1080, "height": 1920},
    ],
    "thumbnail": "https://cdn.example.com/fallback.jpg",
    "duration": 42.5,
}

DRAFT = {
    "name": "Creamy Garlic Pasta",
    "category": "dinner",
    "main_ingredients": [{"name": "spaghetti", "quantity": 200, "unit": "g"}],
    "common_ingredients": ["salt"],
    "instructions": "1. Boil pasta",
    "prep_time": 20,
    "portions": 2,
    "foto_url": "https://cdn.example.com/large.jpg",
    "video_url": "https://www.instagram.com/reel/DAbcdEFghiJ/",
    "field_flags": {"portions": "estimated"},
    "duplicate_of": None,
    "source": {
        "platform": "instagram",
        "video_id": "DAbcdEFghiJ",
        "title": "Creamy garlic pasta 🍝",
        "channel": "Anna Cooks",
        "transcript_used": False,
    },
}


class TestParseShortcode:
    @pytest.mark.parametrize("url", [
        "https://www.instagram.com/reel/DAbcdEFghiJ/",
        "https://www.instagram.com/reel/DAbcdEFghiJ/?igsh=abc123",
        "https://instagram.com/reels/DAbcdEFghiJ",
        "https://m.instagram.com/p/DAbcdEFghiJ/",
        "https://www.instagram.com/tv/DAbcdEFghiJ/",
        "https://www.instagram.com/chef_anna/reel/DAbcdEFghiJ/",
        "www.instagram.com/reel/DAbcdEFghiJ/",
        "https://instagr.am/p/DAbcdEFghiJ/",
    ])
    def test_accepts_supported_formats(self, url):
        assert instagram_client.parse_shortcode(url) == "DAbcdEFghiJ"

    @pytest.mark.parametrize("url", [
        "",
        "   ",
        "https://www.instagram.com/chef_anna/",
        "https://www.instagram.com/stories/chef_anna/123/",
        "https://www.instagram.com/reel/",
        "https://www.instagram.com/reel/abc/",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "ftp://www.instagram.com/reel/DAbcdEFghiJ/",
        "https://evil-instagram.com/reel/DAbcdEFghiJ/",
    ])
    def test_rejects_invalid_urls(self, url):
        assert instagram_client.parse_shortcode(url) is None

    def test_canonical_url(self):
        assert instagram_client.canonical_reel_url("DAbcdEFghiJ") == "https://www.instagram.com/reel/DAbcdEFghiJ/"


def _mock_ydl(mock_ydl_class, info=None, error=None):
    ydl = MagicMock()
    if error:
        ydl.extract_info.side_effect = error
    else:
        ydl.extract_info.return_value = info
    mock_ydl_class.return_value.__enter__.return_value = ydl
    return ydl


class TestFetchReelMetadata:
    @patch("app.services.instagram_client.yt_dlp.YoutubeDL")
    def test_maps_reel_info(self, mock_ydl_class):
        ydl = _mock_ydl(mock_ydl_class, info=REEL_INFO)

        metadata = instagram_client.fetch_reel_metadata("DAbcdEFghiJ", 10, cookies_file="/tmp/cookies.txt")

        assert metadata == {
            "video_id": "DAbcdEFghiJ",
            "title": "Creamy garlic pasta 🍝",
            "description": REEL_INFO["description"],
            "channel": "Anna Cooks",
            "thumbnail_url": "https://cdn.example.com/large.jpg",
            "duration": 42.5,
            "language": None,
        }
        ydl.extract_info.assert_called_once_with("https://www.instagram.com/reel/DAbcdEFghiJ/", download=False)
        options = mock_ydl_class.call_args[0][0]
        assert options["cookiefile"] == "/tmp/cookies.txt"
        assert options["skip_download"] is True

    @patch("app.services.instagram_client.yt_dlp.YoutubeDL")
    def test_falls_back_when_caption_and_thumbnails_are_missing(self, mock_ydl_class):
        _mock_ydl(mock_ydl_class, info={"title": "Video by chef_anna", "uploader_id": "chef_anna",
                                        "thumbnail": "https://cdn.example.com/fallback.jpg"})

        metadata = instagram_client.fetch_reel_metadata("DAbcdEFghiJ", 10)

        assert metadata["title"] == "Video by chef_anna"
        assert metadata["description"] == ""
        assert metadata["channel"] == "chef_anna"
        assert metadata["thumbnail_url"] == "https://cdn.example.com/fallback.jpg"
        assert "cookiefile" not in mock_ydl_class.call_args[0][0]

    @pytest.mark.parametrize("message", [
        "ERROR: [Instagram] DAbcdEFghiJ: Instagram sent an empty media response",
        "ERROR: This content is not available",
        "ERROR: HTTP Error 404: Not Found",
        "ERROR: login required to view this post",
    ])
    @patch("app.services.instagram_client.yt_dlp.YoutubeDL")
    def test_missing_or_private_reel_is_not_found(self, mock_ydl_class, message):
        _mock_ydl(mock_ydl_class, error=DownloadError(message))

        with pytest.raises(VideoNotFoundError):
            instagram_client.fetch_reel_metadata("DAbcdEFghiJ", 10)

    @patch("app.services.instagram_client.yt_dlp.YoutubeDL")
    def test_empty_result_is_not_found(self, mock_ydl_class):
        _mock_ydl(mock_ydl_class, info=None)

        with pytest.raises(VideoNotFoundError):
            instagram_client.fetch_reel_metadata("DAbcdEFghiJ", 10)

    @patch("app.services.instagram_client.yt_dlp.YoutubeDL")
    def test_other_download_errors_are_fetch_errors(self, mock_ydl_class):
        _mock_ydl(mock_ydl_class, error=DownloadError("ERROR: HTTP Error 429: Too Many Requests"))

        with pytest.raises(SourceFetchError):
            instagram_client.fetch_reel_metadata("DAbcdEFghiJ", 10)

    @patch("app.services.instagram_client._extract_info")
    def test_slow_lookup_times_out(self, mock_extract):
        def slow(*_args):
            import time
            time.sleep(0.5)
        mock_extract.side_effect = slow

        with pytest.raises(SourceTimeoutError):
            instagram_client.fetch_reel_metadata("DAbcdEFghiJ", 0.05)


class TestImportFromInstagram:
    @patch.dict("os.environ", {"ANTHROPIC_API_KEY": "key", "INSTAGRAM_COOKIES_FILE": "/tmp/c.txt"})
    @patch("app.services.recipe_importer.build_draft")
    @patch("app.services.recipe_importer.call_llm")
    @patch("app.services.recipe_importer.instagram_client.fetch_reel_metadata")
    def test_builds_draft_from_caption(self, mock_fetch, mock_llm, mock_build):
        mock_fetch.return_value = {"title": "Creamy garlic pasta 🍝", "channel": "Anna Cooks"}
        mock_build.return_value = ({"name": "Creamy Garlic Pasta"}, {"portions": "estimated"})

        draft = recipe_importer.import_from_instagram("DAbcdEFghiJ")

        mock_fetch.assert_called_once_with("DAbcdEFghiJ", recipe_importer.INSTAGRAM_TIMEOUT_SECONDS, "/tmp/c.txt")
        llm_args = mock_llm.call_args[0]
        assert llm_args[1] is None
        assert llm_args[5] == "instagram"
        assert draft["video_url"] == "https://www.instagram.com/reel/DAbcdEFghiJ/"
        assert draft["field_flags"] == {"portions": "estimated"}
        assert draft["source"] == {
            "platform": "instagram",
            "video_id": "DAbcdEFghiJ",
            "title": "Creamy garlic pasta 🍝",
            "channel": "Anna Cooks",
            "transcript_used": False,
        }

    @patch.dict("os.environ", {"ANTHROPIC_API_KEY": ""})
    def test_requires_anthropic_key(self):
        with pytest.raises(recipe_importer.MissingConfigError):
            recipe_importer.import_from_instagram("DAbcdEFghiJ")


class TestInstagramImportEndpoint:
    @patch("app.routes.recipe_import.DatabaseClient")
    @patch("app.services.recipe_importer.import_from_instagram")
    def test_returns_draft_with_duplicate(self, mock_import, mock_db_class):
        mock_import.return_value = dict(DRAFT)
        db = mock_db_class.return_value
        db.connect.return_value = True
        db.find_recipes_by_video_id.return_value = [
            {"id": 9, "name": "Other", "video_url": "https://www.instagram.com/reel/DAbcdEFghiJx/"},
            {"id": 7, "name": "Garlic Pasta", "video_url": "https://instagram.com/p/DAbcdEFghiJ/"},
        ]

        response = client.post("/recipes/import/instagram", json={"url": REEL_URL})

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "success"
        assert body["draft"]["source"]["platform"] == "instagram"
        assert body["draft"]["duplicate_of"] == {"id": 7, "name": "Garlic Pasta"}
        mock_import.assert_called_once_with("DAbcdEFghiJ")
        db.disconnect.assert_called_once()

    @patch("app.routes.recipe_import.DatabaseClient")
    @patch("app.services.recipe_importer.import_from_instagram")
    def test_duplicate_check_failure_does_not_block_import(self, mock_import, mock_db_class):
        mock_import.return_value = dict(DRAFT)
        mock_db_class.return_value.connect.side_effect = Exception("db down")

        response = client.post("/recipes/import/instagram", json={"url": REEL_URL})

        assert response.status_code == 200
        assert response.json()["draft"]["duplicate_of"] is None

    def test_rejects_non_instagram_url(self):
        response = client.post("/recipes/import/instagram", json={"url": "https://vimeo.com/1"})

        assert response.status_code == 422

    @pytest.mark.parametrize("error, status, code", [
        (recipe_importer.MissingConfigError("ANTHROPIC_API_KEY is not configured"), 503, "not_configured"),
        (VideoNotFoundError("DAbcdEFghiJ"), 404, "video_not_found"),
        (NotARecipeError(), 422, "not_a_recipe"),
        (SourceTimeoutError("slow"), 504, "timeout"),
        (ExtractionTimeoutError("slow"), 504, "timeout"),
        (SourceFetchError("429"), 502, "upstream_error"),
        (ExtractionError("bad output"), 502, "upstream_error"),
        (RuntimeError("boom"), 500, "internal_error"),
    ])
    @patch("app.services.recipe_importer.import_from_instagram")
    def test_maps_errors(self, mock_import, error, status, code):
        mock_import.side_effect = error

        response = client.post("/recipes/import/instagram", json={"url": REEL_URL})

        assert response.status_code == status
        assert response.json()["detail"]["code"] == code
