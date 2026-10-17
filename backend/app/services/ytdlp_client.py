"""
Shared yt-dlp metadata lookup for platforms without a usable official API (Instagram, Facebook).
Downloads nothing; enforces a hard timeout and maps yt-dlp failures onto the shared source errors.
"""
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import Any, Dict, Optional

import yt_dlp
from yt_dlp.utils import DownloadError

from .source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

logger = logging.getLogger(__name__)

NOT_FOUND_MARKERS = ("not available", "unavailable", "does not exist", "private", "404", "removed")
# Meta answers anonymous requests for missing *and* login-gated videos the same way
LOGIN_OR_MISSING_MARKERS = ("empty media response", "login", "cookies", "cannot parse data")
TITLE_MAX_CHARS = 120


class _SilentYtDlpLogger:
    """yt-dlp prints errors to stderr even with quiet=True; failures are reported via exceptions instead"""

    def debug(self, _msg: str) -> None:
        pass

    def info(self, _msg: str) -> None:
        pass

    def warning(self, _msg: str) -> None:
        pass

    def error(self, _msg: str) -> None:
        pass


def _extract_info(url: str, timeout: float, cookies_file: Optional[str]) -> Dict[str, Any]:
    options: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": timeout,
        "logger": _SilentYtDlpLogger(),
    }
    if cookies_file:
        options["cookiefile"] = cookies_file
    with yt_dlp.YoutubeDL(options) as ydl:
        return ydl.extract_info(url, download=False)


def extract_video_info(url: str, video_ref: str, timeout: float, cookies_file: Optional[str],
                       cookies_env_name: str) -> Dict[str, Any]:
    """Return yt-dlp's info dict for a single public video, or raise a source error"""
    cookies_hint = f"set {cookies_env_name} if the video is public but requires a session"
    executor = ThreadPoolExecutor(max_workers=1)
    try:
        info = executor.submit(_extract_info, url, timeout, cookies_file).result(timeout=timeout)
    except FutureTimeoutError as e:
        raise SourceTimeoutError(f"Lookup timed out for {url}") from e
    except DownloadError as e:
        message = str(e).lower()
        if any(marker in message for marker in LOGIN_OR_MISSING_MARKERS):
            logger.warning("Video %s is missing or needs login (%s): %s", video_ref, cookies_hint, e)
            raise VideoNotFoundError(video_ref) from e
        if any(marker in message for marker in NOT_FOUND_MARKERS):
            raise VideoNotFoundError(video_ref) from e
        logger.warning("Lookup failed for %s (%s): %s", video_ref, cookies_hint, e)
        raise SourceFetchError(f"Lookup failed for {video_ref}: {e}") from e
    finally:
        executor.shutdown(wait=False)

    if not info:
        raise VideoNotFoundError(video_ref)
    return info


def first_caption_line(caption: str) -> str:
    for line in caption.splitlines():
        if line.strip():
            return line.strip()[:TITLE_MAX_CHARS]
    return ""


def best_thumbnail(info: Dict[str, Any]) -> Optional[str]:
    thumbnails = [t for t in info.get("thumbnails") or [] if t.get("url")]
    if thumbnails:
        best = max(thumbnails, key=lambda t: ((t.get("width") or 0) * (t.get("height") or 0), t.get("preference") or 0))
        return best["url"]
    return info.get("thumbnail")


def to_metadata(info: Dict[str, Any], video_id: str, caption: str) -> Dict[str, Any]:
    """Map a yt-dlp info dict onto the metadata shape the recipe extractor expects"""
    return {
        "video_id": video_id,
        "title": first_caption_line(caption) or info.get("title") or "",
        "description": caption,
        "channel": info.get("uploader") or info.get("channel") or info.get("uploader_id") or "",
        "thumbnail_url": best_thumbnail(info),
        "duration": info.get("duration"),
        "language": None,
    }
