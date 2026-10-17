"""
Unit tests for the YouTube import: URL parsing, Data API client, transcripts, importer and endpoint
"""
import time
from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import recipe_importer, transcript_client, youtube_client
from app.services.source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

client = TestClient(app)

VIDEO_ID = "dQw4w9WgXcQ"

DRAFT = {
    "name": "Pasta",
    "category": "dinner",
    "main_ingredients": [{"name": "spaghetti", "quantity": 200, "unit": "g"}],
    "common_ingredients": ["salt"],
    "instructions": "1. Boil",
    "prep_time": 20,
    "portions": 2,
    "foto_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "field_flags": {},
    "duplicate_of": None,
    "source": {"platform": "youtube", "video_id": VIDEO_ID, "title": "Pasta", "channel": "Chef",
               "transcript_used": True},
}

API_ITEM = {
    "snippet": {
        "title": "Pasta!!",
        "description": "200g spaghetti",
        "channelTitle": "Chef",
        "thumbnails": {
            "high": {"url": "https://i.ytimg.com/high.jpg"},
            "maxres": {"url": "https://i.ytimg.com/maxres.jpg"},
        },
        "defaultAudioLanguage": "it",
    },
    "contentDetails": {"duration": "PT10M"},
}


class TestParseVideoId:
    @pytest.mark.parametrize("url", [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL123",
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ?si=abc",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "youtube.com/watch?v=dQw4w9WgXcQ",
    ])
    def test_accepts_supported_formats(self, url):
        assert youtube_client.parse_video_id(url) == VIDEO_ID

    @pytest.mark.parametrize("url", [
        "", "  ", "https://vimeo.com/123", "ftp://youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=short", "https://www.youtube.com/watch",
        "https://www.youtube.com/channel/UC123", "https://youtu.be/",
    ])
    def test_rejects_invalid_urls(self, url):
        assert youtube_client.parse_video_id(url) is None

    def test_canonical_url(self):
        assert youtube_client.canonical_video_url(VIDEO_ID) == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    def test_best_thumbnail_prefers_highest_resolution(self):
        assert youtube_client.best_thumbnail_url(API_ITEM["snippet"]["thumbnails"]) == "https://i.ytimg.com/maxres.jpg"
        assert youtube_client.best_thumbnail_url({"medium": {"url": "m.jpg"}}) == "m.jpg"
        assert youtube_client.best_thumbnail_url({}) is None


@patch("app.services.youtube_client.httpx.get")
class TestFetchVideoMetadata:
    def test_maps_api_response(self, mock_get):
        mock_get.return_value = MagicMock(status_code=200, json=lambda: {"items": [API_ITEM]})

        metadata = youtube_client.fetch_video_metadata(VIDEO_ID, "key", 5)

        assert metadata == {
            "video_id": VIDEO_ID,
            "title": "Pasta!!",
            "description": "200g spaghetti",
            "channel": "Chef",
            "thumbnail_url": "https://i.ytimg.com/maxres.jpg",
            "duration": "PT10M",
            "language": "it",
        }
        assert mock_get.call_args.kwargs["params"] == {"part": "snippet,contentDetails", "id": VIDEO_ID, "key": "key"}
        assert mock_get.call_args.kwargs["timeout"] == 5

    def test_empty_items_is_not_found(self, mock_get):
        mock_get.return_value = MagicMock(status_code=200, json=lambda: {"items": []})

        with pytest.raises(VideoNotFoundError):
            youtube_client.fetch_video_metadata(VIDEO_ID, "key", 5)

    def test_http_error_status_is_fetch_error(self, mock_get):
        mock_get.return_value = MagicMock(status_code=403)

        with pytest.raises(SourceFetchError):
            youtube_client.fetch_video_metadata(VIDEO_ID, "key", 5)

    def test_timeout_is_source_timeout(self, mock_get):
        mock_get.side_effect = httpx.ReadTimeout("slow")

        with pytest.raises(SourceTimeoutError):
            youtube_client.fetch_video_metadata(VIDEO_ID, "key", 5)

    def test_connection_error_is_fetch_error(self, mock_get):
        mock_get.side_effect = httpx.ConnectError("down")

        with pytest.raises(SourceFetchError) as error:
            youtube_client.fetch_video_metadata(VIDEO_ID, "key", 5)
        assert not isinstance(error.value, SourceTimeoutError)


def _transcript(language_code, is_generated, texts):
    transcript = MagicMock(language_code=language_code, is_generated=is_generated)
    transcript.fetch.return_value = [MagicMock(text=text) for text in texts]
    return transcript


@patch("app.services.transcript_client.YouTubeTranscriptApi")
class TestFetchTranscript:
    def test_prefers_manual_english_captions(self, mock_api_class):
        mock_api_class.return_value.list.return_value = [
            _transcript("en", True, ["auto english"]),
            _transcript("it", False, ["manuale"]),
            _transcript("en-GB", False, ["Boil the", "pasta"]),
        ]

        assert transcript_client.fetch_transcript(VIDEO_ID) == "Boil the pasta"

    def test_returns_none_without_transcripts(self, mock_api_class):
        mock_api_class.return_value.list.return_value = []

        assert transcript_client.fetch_transcript(VIDEO_ID) is None

    def test_returns_none_for_blank_transcript(self, mock_api_class):
        mock_api_class.return_value.list.return_value = [_transcript("en", False, [" "])]

        assert transcript_client.fetch_transcript(VIDEO_ID) is None

    def test_returns_none_when_library_fails(self, mock_api_class):
        mock_api_class.return_value.list.side_effect = Exception("captions disabled")

        assert transcript_client.fetch_transcript(VIDEO_ID) is None


@patch.dict("os.environ", {"YOUTUBE_API_KEY": "yt-key", "ANTHROPIC_API_KEY": "key", "ANTHROPIC_MODEL": ""})
@patch("app.services.recipe_importer.build_draft")
@patch("app.services.recipe_importer.call_llm")
@patch("app.services.recipe_importer.youtube_client.fetch_video_metadata")
class TestImportFromYoutube:
    def test_builds_draft_from_metadata_and_transcript(self, mock_fetch, mock_llm, mock_build):
        mock_fetch.return_value = {"title": "Pasta!!", "channel": "Chef"}
        mock_build.return_value = ({"name": "Pasta"}, {})

        with patch("app.services.recipe_importer.transcript_client.fetch_transcript", return_value="Boil it"):
            draft = recipe_importer.import_from_youtube(VIDEO_ID)

        llm_args = mock_llm.call_args[0]
        assert llm_args[1] == "Boil it"
        assert llm_args[3] == "claude-haiku-5-5"
        assert llm_args[5] == "youtube"
        assert draft["video_url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert draft["source"] == {"platform": "youtube", "video_id": VIDEO_ID, "title": "Pasta!!",
                                   "channel": "Chef", "transcript_used": True}

    def test_slow_transcript_is_skipped(self, mock_fetch, mock_llm, mock_build):
        mock_fetch.return_value = {"title": "Pasta!!", "channel": "Chef"}
        mock_build.return_value = ({}, {})

        def slow_transcript(_video_id):
            time.sleep(0.3)
            return "too late"

        with patch("app.services.recipe_importer.transcript_client.fetch_transcript", side_effect=slow_transcript), \
                patch.object(recipe_importer, "TRANSCRIPT_TIMEOUT_SECONDS", 0.01):
            draft = recipe_importer.import_from_youtube(VIDEO_ID)

        assert mock_llm.call_args[0][1] is None
        assert draft["source"]["transcript_used"] is False

    def test_uses_configured_model(self, mock_fetch, mock_llm, mock_build):
        mock_fetch.return_value = {}
        mock_build.return_value = ({}, {})

        with patch.dict("os.environ", {"ANTHROPIC_MODEL": "claude-sonnet-5-5"}), \
                patch("app.services.recipe_importer.transcript_client.fetch_transcript", return_value=None):
            recipe_importer.import_from_youtube(VIDEO_ID)

        assert mock_llm.call_args[0][3] == "claude-sonnet-5-5"

    def test_requires_youtube_key(self, mock_fetch, mock_llm, mock_build):
        with patch.dict("os.environ", {"YOUTUBE_API_KEY": " "}):
            with pytest.raises(recipe_importer.MissingConfigError, match="YOUTUBE_API_KEY"):
                recipe_importer.import_from_youtube(VIDEO_ID)
        mock_fetch.assert_not_called()


class TestYoutubeImportEndpoint:
    @patch("app.routes.recipe_import.DatabaseClient")
    @patch("app.services.recipe_importer.import_from_youtube")
    def test_returns_draft_with_duplicate(self, mock_import, mock_db_class):
        mock_import.return_value = dict(DRAFT)
        db = mock_db_class.return_value
        db.connect.return_value = True
        db.find_recipes_by_video_id.return_value = [
            {"id": 4, "name": "No video", "video_url": None},
            {"id": 5, "name": "Old pasta", "video_url": "https://youtu.be/dQw4w9WgXcQ"},
        ]

        response = client.post("/recipes/import/youtube", json={"url": "https://youtu.be/dQw4w9WgXcQ?t=5"})

        assert response.status_code == 200
        assert response.json()["draft"]["duplicate_of"] == {"id": 5, "name": "Old pasta"}
        mock_import.assert_called_once_with(VIDEO_ID)

    @patch("app.routes.recipe_import.DatabaseClient")
    @patch("app.services.recipe_importer.import_from_youtube")
    def test_skips_duplicate_check_when_database_is_down(self, mock_import, mock_db_class):
        mock_import.return_value = dict(DRAFT)
        mock_db_class.return_value.connect.return_value = False

        response = client.post("/recipes/import/youtube", json={"url": "https://youtu.be/dQw4w9WgXcQ"})

        assert response.status_code == 200
        assert response.json()["draft"]["duplicate_of"] is None
        mock_db_class.return_value.find_recipes_by_video_id.assert_not_called()

    @patch("app.routes.recipe_import.DatabaseClient")
    @patch("app.services.recipe_importer.import_from_youtube")
    def test_no_duplicate_when_no_recipe_matches(self, mock_import, mock_db_class):
        mock_import.return_value = dict(DRAFT)
        db = mock_db_class.return_value
        db.connect.return_value = True
        db.find_recipes_by_video_id.return_value = []

        response = client.post("/recipes/import/youtube", json={"url": "https://youtu.be/dQw4w9WgXcQ"})

        assert response.json()["draft"]["duplicate_of"] is None

    def test_rejects_non_youtube_url(self):
        response = client.post("/recipes/import/youtube", json={"url": "https://vimeo.com/1"})

        assert response.status_code == 422
        assert "Not a valid YouTube video URL" in response.json()["detail"][0]["msg"]

    @patch("app.services.recipe_importer.import_from_youtube")
    def test_maps_not_found(self, mock_import):
        mock_import.side_effect = VideoNotFoundError(VIDEO_ID)

        response = client.post("/recipes/import/youtube", json={"url": "https://youtu.be/dQw4w9WgXcQ"})

        assert response.status_code == 404
        assert response.json()["detail"] == {"code": "video_not_found", "message": "Video not found or not public."}
