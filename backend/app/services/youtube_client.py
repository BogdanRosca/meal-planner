"""
YouTube URL parsing and YouTube Data API v3 metadata lookup.
"""
import re
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

import httpx

from .source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos"
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com"}
SHORT_HOSTS = {"youtu.be", "www.youtu.be"}
THUMBNAIL_PREFERENCE = ("maxres", "high", "medium", "default")


def parse_video_id(url: str) -> Optional[str]:
    """Extract the 11-char video ID from any supported YouTube URL format, or None"""
    candidate = (url or "").strip()
    if not candidate:
        return None
    if "://" not in candidate:
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    if parsed.scheme not in ("http", "https"):
        return None

    host = (parsed.hostname or "").lower()
    segments = [segment for segment in parsed.path.split("/") if segment]
    video_id = None

    if host in SHORT_HOSTS and segments:
        video_id = segments[0]
    elif host in YOUTUBE_HOSTS:
        if parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        elif len(segments) >= 2 and segments[0] in ("shorts", "embed", "live"):
            video_id = segments[1]

    if video_id and VIDEO_ID_PATTERN.match(video_id):
        return video_id
    return None


def canonical_video_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def best_thumbnail_url(thumbnails: Dict[str, Any]) -> Optional[str]:
    for size in THUMBNAIL_PREFERENCE:
        url = (thumbnails.get(size) or {}).get("url")
        if url:
            return url
    return None


def fetch_video_metadata(video_id: str, api_key: str, timeout: float) -> Dict[str, Any]:
    """Return title, description, channel, thumbnail, duration and language for a public video"""
    try:
        response = httpx.get(
            YOUTUBE_API_URL,
            params={"part": "snippet,contentDetails", "id": video_id, "key": api_key},
            timeout=timeout,
        )
    except httpx.TimeoutException as e:
        raise SourceTimeoutError("YouTube API timed out") from e
    except httpx.HTTPError as e:
        raise SourceFetchError(f"YouTube API request failed: {e}") from e

    if response.status_code != 200:
        raise SourceFetchError(f"YouTube API returned HTTP {response.status_code}")

    items = response.json().get("items") or []
    if not items:
        raise VideoNotFoundError(video_id)

    snippet = items[0].get("snippet", {})
    content_details = items[0].get("contentDetails", {})
    return {
        "video_id": video_id,
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "channel": snippet.get("channelTitle", ""),
        "thumbnail_url": best_thumbnail_url(snippet.get("thumbnails") or {}),
        "duration": content_details.get("duration"),
        "language": snippet.get("defaultAudioLanguage") or snippet.get("defaultLanguage"),
    }
