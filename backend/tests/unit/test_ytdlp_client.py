"""
Unit tests for the shared yt-dlp lookup used by the Instagram and Facebook imports
"""
from unittest.mock import patch

import pytest
from yt_dlp.utils import DownloadError

from app.services import ytdlp_client
from app.services.source_errors import SourceFetchError, VideoNotFoundError


class TestSilentLogger:
    def test_swallows_every_level(self):
        logger = ytdlp_client._SilentYtDlpLogger()

        for method in (logger.debug, logger.info, logger.warning, logger.error):
            assert method("ERROR: something") is None


@patch("app.services.ytdlp_client.yt_dlp.YoutubeDL")
class TestExtractVideoInfo:
    def test_downloads_nothing_and_uses_the_silent_logger(self, mock_ydl_class):
        mock_ydl_class.return_value.__enter__.return_value.extract_info.return_value = {"id": "1"}

        info = ytdlp_client.extract_video_info("https://example.com/v/1", "1", 7, None, "X_COOKIES_FILE")

        assert info == {"id": "1"}
        options = mock_ydl_class.call_args[0][0]
        assert options["skip_download"] is True
        assert options["socket_timeout"] == 7
        assert isinstance(options["logger"], ytdlp_client._SilentYtDlpLogger)
        assert "cookiefile" not in options

    def test_logs_a_cookies_hint_for_login_walls(self, mock_ydl_class, caplog):
        mock_ydl_class.return_value.__enter__.return_value.extract_info.side_effect = DownloadError(
            "ERROR: login required")

        with pytest.raises(VideoNotFoundError):
            ytdlp_client.extract_video_info("https://example.com/v/1", "1", 7, None, "X_COOKIES_FILE")
        assert "set X_COOKIES_FILE" in caplog.text

    def test_other_errors_are_fetch_errors_with_hint(self, mock_ydl_class, caplog):
        mock_ydl_class.return_value.__enter__.return_value.extract_info.side_effect = DownloadError(
            "ERROR: HTTP Error 500")

        with pytest.raises(SourceFetchError):
            ytdlp_client.extract_video_info("https://example.com/v/1", "1", 7, None, "X_COOKIES_FILE")
        assert "set X_COOKIES_FILE" in caplog.text


class TestToMetadata:
    def test_prefers_caption_line_and_largest_thumbnail(self):
        info = {
            "title": "Video by chef",
            "channel": "Chef Channel",
            "thumbnails": [
                {"url": "a.jpg", "width": 100, "height": 100},
                {"url": "b.jpg", "width": 100, "height": 100, "preference": 1},
                {"width": 4000, "height": 4000},
            ],
        }

        metadata = ytdlp_client.to_metadata(info, "1", "\n\n  Pasta night  \nmore")

        assert metadata["title"] == "Pasta night"
        assert metadata["channel"] == "Chef Channel"
        assert metadata["thumbnail_url"] == "b.jpg"

    def test_long_first_line_is_truncated(self):
        metadata = ytdlp_client.to_metadata({}, "1", "x" * 500)

        assert len(metadata["title"]) == ytdlp_client.TITLE_MAX_CHARS
        assert metadata["thumbnail_url"] is None
        assert metadata["channel"] == ""
