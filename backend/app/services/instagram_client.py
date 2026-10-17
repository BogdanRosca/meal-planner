"""
Instagram reel URL parsing and metadata lookup via yt-dlp (no official API is usable:
Meta's oEmbed no longer returns thumbnails/author and requires App Review).
"""
import re
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from . import ytdlp_client

SHORTCODE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{5,40}$")
INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am", "www.instagr.am"}
POST_PATH_PREFIXES = {"reel", "reels", "p", "tv"}


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


def fetch_reel_metadata(shortcode: str, timeout: float, cookies_file: Optional[str] = None) -> Dict[str, Any]:
    """Return caption, uploader and thumbnail for a public reel, in the extractor's metadata shape"""
    info = ytdlp_client.extract_video_info(canonical_reel_url(shortcode), shortcode, timeout, cookies_file,
                                           "INSTAGRAM_COOKIES_FILE")
    return ytdlp_client.to_metadata(info, shortcode, (info.get("description") or "").strip())
