"""
Orchestrates a video import: source metadata (+ transcript where available) -> LLM extraction -> draft.
Nothing is persisted here.
"""
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import Any, Dict, Optional

from . import facebook_client, instagram_client, transcript_client, youtube_client
from .recipe_extractor import DEFAULT_MODEL, build_draft, call_llm

# Budget split for the 30 s end-to-end limit
YOUTUBE_TIMEOUT_SECONDS = 6.0
TRANSCRIPT_TIMEOUT_SECONDS = 6.0
INSTAGRAM_TIMEOUT_SECONDS = 10.0
FACEBOOK_RESOLVE_TIMEOUT_SECONDS = 4.0
FACEBOOK_TIMEOUT_SECONDS = 10.0
LLM_TIMEOUT_SECONDS = 20.0


class MissingConfigError(Exception):
    """A required API key is not configured"""


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise MissingConfigError(f"{name} is not configured on the server")
    return value


def _draft_from(metadata: Dict[str, Any], transcript: Optional[str], platform: str,
                video_id: str, canonical_url: str, anthropic_key: str) -> Dict[str, Any]:
    model = os.getenv("ANTHROPIC_MODEL", "").strip() or DEFAULT_MODEL
    extraction = call_llm(metadata, transcript, anthropic_key, model, LLM_TIMEOUT_SECONDS, platform)
    draft, flags = build_draft(extraction, metadata)
    draft["video_url"] = canonical_url

    return {
        **draft,
        "field_flags": flags,
        "duplicate_of": None,
        "source": {
            "platform": platform,
            "video_id": video_id,
            "title": metadata.get("title", ""),
            "channel": metadata.get("channel", ""),
            "transcript_used": transcript is not None,
        },
    }


def import_from_youtube(video_id: str) -> Dict[str, Any]:
    youtube_key = _require_env("YOUTUBE_API_KEY")
    anthropic_key = _require_env("ANTHROPIC_API_KEY")

    executor = ThreadPoolExecutor(max_workers=2)
    try:
        transcript_future = executor.submit(transcript_client.fetch_transcript, video_id)
        metadata = youtube_client.fetch_video_metadata(video_id, youtube_key, YOUTUBE_TIMEOUT_SECONDS)
        try:
            transcript = transcript_future.result(timeout=TRANSCRIPT_TIMEOUT_SECONDS)
        except FutureTimeoutError:
            transcript = None
    finally:
        # Don't block on a slow transcript fetch; it is abandoned, not awaited
        executor.shutdown(wait=False)

    return _draft_from(metadata, transcript, "youtube", video_id,
                       youtube_client.canonical_video_url(video_id), anthropic_key)


def import_from_instagram(shortcode: str) -> Dict[str, Any]:
    anthropic_key = _require_env("ANTHROPIC_API_KEY")
    cookies_file = os.getenv("INSTAGRAM_COOKIES_FILE", "").strip() or None

    metadata = instagram_client.fetch_reel_metadata(shortcode, INSTAGRAM_TIMEOUT_SECONDS, cookies_file)
    # Reels have no downloadable captions; the post caption is the only text source
    return _draft_from(metadata, None, "instagram", shortcode,
                       instagram_client.canonical_reel_url(shortcode), anthropic_key)


def import_from_facebook(reference: str) -> Dict[str, Any]:
    anthropic_key = _require_env("ANTHROPIC_API_KEY")
    cookies_file = os.getenv("FACEBOOK_COOKIES_FILE", "").strip() or None

    video_id = facebook_client.resolve_video_id(reference, FACEBOOK_RESOLVE_TIMEOUT_SECONDS)
    metadata = facebook_client.fetch_video_metadata(video_id, FACEBOOK_TIMEOUT_SECONDS, cookies_file)
    # Like Instagram, Facebook has no downloadable captions; the post text is the only text source
    return _draft_from(metadata, None, "facebook", video_id,
                       facebook_client.canonical_video_url(video_id), anthropic_key)
