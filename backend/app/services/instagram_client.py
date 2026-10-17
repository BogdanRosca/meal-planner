"""
Instagram reel URL parsing and metadata lookup via yt-dlp (no official API is usable:
Meta's oEmbed no longer returns thumbnails/author and requires App Review).
"""
import logging
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import yt_dlp
from yt_dlp.utils import DownloadError

from .source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

logger = logging.getLogger(__name__)


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


SHORTCODE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{5,40}$")
INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am", "www.instagr.am"}
POST_PATH_PREFIXES = {"reel", "reels", "p", "tv"}
NOT_FOUND_MARKERS = ("not available", "does not exist", "private", "404", "removed")
# Instagram answers anonymous requests for missing *and* login-gated reels with an empty response
LOGIN_OR_MISSING_MARKERS = ("empty media response", "login", "cookies")
COOKIES_HINT = "set INSTAGRAM_COOKIES_FILE if the reel is public but requires a session"
TITLE_MAX_CHARS = 120


def parse_shortcode(url: str) -> Optional[str]:
    """Extract the post shortcode from a reel/post URL, or None"""
    candidate = (url or "").strip()
    if not candidate:
        return None
    if "://" not in candidate:
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    if parsed.scheme not in ("http", "https"):
        return None
    if (parsed.hostname or "").lower() not in INSTAGRAM_HOSTS:
        return None

    segments = [segment for segment in parsed.path.split("/") if segment]
    # Also accept /{username}/reel/{code}/ share links
    for index, segment in enumerate(segments[:-1]):
        if segment in POST_PATH_PREFIXES and SHORTCODE_PATTERN.match(segments[index + 1]):
            return segments[index + 1]
    return None


def canonical_reel_url(shortcode: str) -> str:
    return f"https://www.instagram.com/reel/{shortcode}/"


def _first_caption_line(caption: str) -> str:
    for line in caption.splitlines():
        if line.strip():
            return line.strip()[:TITLE_MAX_CHARS]
    return ""


def _best_thumbnail(info: Dict[str, Any]) -> Optional[str]:
    thumbnails = [t for t in info.get("thumbnails") or [] if t.get("url")]
    if thumbnails:
        best = max(thumbnails, key=lambda t: ((t.get("width") or 0) * (t.get("height") or 0), t.get("preference") or 0))
        return best["url"]
    return info.get("thumbnail")


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


def fetch_reel_metadata(shortcode: str, timeout: float, cookies_file: Optional[str] = None) -> Dict[str, Any]:
    """Return caption, uploader and thumbnail for a public reel, in the extractor's metadata shape"""
    executor = ThreadPoolExecutor(max_workers=1)
    try:
        future = executor.submit(_extract_info, canonical_reel_url(shortcode), timeout, cookies_file)
        info = future.result(timeout=timeout)
    except FutureTimeoutError as e:
        raise SourceTimeoutError("Instagram lookup timed out") from e
    except DownloadError as e:
        message = str(e).lower()
        if any(marker in message for marker in LOGIN_OR_MISSING_MARKERS):
            logger.warning("Instagram reel %s is missing or needs login (%s): %s", shortcode, COOKIES_HINT, e)
            raise VideoNotFoundError(shortcode) from e
        if any(marker in message for marker in NOT_FOUND_MARKERS):
            raise VideoNotFoundError(shortcode) from e
        logger.warning("Instagram lookup failed for %s (%s): %s", shortcode, COOKIES_HINT, e)
        raise SourceFetchError(f"Instagram lookup failed: {e}") from e
    finally:
        executor.shutdown(wait=False)

    if not info:
        raise VideoNotFoundError(shortcode)

    caption = (info.get("description") or "").strip()
    return {
        "video_id": shortcode,
        "title": _first_caption_line(caption) or info.get("title") or "",
        "description": caption,
        "channel": info.get("uploader") or info.get("channel") or info.get("uploader_id") or "",
        "thumbnail_url": _best_thumbnail(info),
        "duration": info.get("duration"),
        "language": None,
    }
