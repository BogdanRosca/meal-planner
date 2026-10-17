"""
Facebook reel/video URL parsing and metadata lookup via yt-dlp (no public API exposes
video captions without App Review). Short share links are resolved to a numeric video ID first.
"""
import re
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

import httpx

from . import ytdlp_client
from .source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

VIDEO_ID_PATTERN = re.compile(r"^\d{5,25}$")
SHORT_CODE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,40}$")
FACEBOOK_HOST_PATTERN = re.compile(r"^(?:[\w-]+\.)?facebook\.com$")
SHORT_HOSTS = {"fb.watch", "www.fb.watch"}
WATCH_PATHS = {"/watch", "/watch/", "/video.php", "/video/video.php"}
SHARE_KINDS = {"r", "v"}
# Mobile Safari UA: Facebook serves a plain redirect instead of an interstitial page
RESOLVE_HEADERS = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"}


def _parse(url: str):
    candidate = (url or "").strip()
    if not candidate:
        return None
    if "://" not in candidate:
        candidate = f"https://{candidate}"
    parsed = urlparse(candidate)
    if parsed.scheme not in ("http", "https"):
        return None
    return parsed


def parse_video_id(url: str) -> Optional[str]:
    """Extract the numeric video ID from a full Facebook reel/watch/video URL, or None"""
    parsed = _parse(url)
    if not parsed or not FACEBOOK_HOST_PATTERN.match((parsed.hostname or "").lower()):
        return None

    segments = [segment for segment in parsed.path.split("/") if segment]
    candidate = None
    if parsed.path in WATCH_PATHS:
        candidate = parse_qs(parsed.query).get("v", [None])[0]
    elif len(segments) >= 2 and segments[0] in ("reel", "reels"):
        candidate = segments[1]
    elif "videos" in segments[:-1]:
        # /{page}/videos/{id}/ and /{page}/videos/{slug}/{id}/
        candidate = next((s for s in reversed(segments) if VIDEO_ID_PATTERN.match(s)), None)

    return candidate if candidate and VIDEO_ID_PATTERN.match(candidate) else None


def parse_short_link(url: str) -> Optional[str]:
    """Normalise an fb.watch or facebook.com/share/{r|v}/ link (needs resolving), or None"""
    parsed = _parse(url)
    if not parsed:
        return None
    host = (parsed.hostname or "").lower()
    segments = [segment for segment in parsed.path.split("/") if segment]

    if host in SHORT_HOSTS and len(segments) == 1 and SHORT_CODE_PATTERN.match(segments[0]):
        return f"https://fb.watch/{segments[0]}/"
    if (FACEBOOK_HOST_PATTERN.match(host) and len(segments) == 3 and segments[0] == "share"
            and segments[1] in SHARE_KINDS and SHORT_CODE_PATTERN.match(segments[2])):
        return f"https://www.facebook.com/share/{segments[1]}/{segments[2]}/"
    return None


def parse_reference(url: str) -> Optional[str]:
    """What an import starts from: a numeric video ID, or a normalised short link to resolve"""
    return parse_video_id(url) or parse_short_link(url)


def canonical_video_url(video_id: str) -> str:
    return f"https://www.facebook.com/watch/?v={video_id}"


def resolve_video_id(reference: str, timeout: float) -> str:
    """Return the numeric video ID, following the redirect of a short share link if needed"""
    if VIDEO_ID_PATTERN.match(reference):
        return reference
    try:
        response = httpx.get(reference, follow_redirects=True, timeout=timeout, headers=RESOLVE_HEADERS)
    except httpx.TimeoutException as e:
        raise SourceTimeoutError("Facebook short link timed out") from e
    except httpx.HTTPError as e:
        raise SourceFetchError(f"Facebook short link failed: {e}") from e

    video_id = parse_video_id(str(response.url))
    if not video_id:
        # Redirected to a login wall or an error page: the video is not publicly reachable
        raise VideoNotFoundError(reference)
    return video_id


def fetch_video_metadata(video_id: str, timeout: float, cookies_file: Optional[str] = None) -> Dict[str, Any]:
    """Return caption, uploader and thumbnail for a public video, in the extractor's metadata shape"""
    info = ytdlp_client.extract_video_info(canonical_video_url(video_id), video_id, timeout, cookies_file,
                                           "FACEBOOK_COOKIES_FILE")
    caption = (info.get("description") or "").strip()
    return ytdlp_client.to_metadata(info, video_id, caption)
