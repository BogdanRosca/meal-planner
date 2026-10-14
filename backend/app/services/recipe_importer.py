"""
Orchestrates a YouTube import: metadata + transcript (in parallel) -> LLM extraction -> draft.
Nothing is persisted here.
"""
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import Any, Dict

from . import transcript_client, youtube_client
from .recipe_extractor import DEFAULT_MODEL, build_draft, call_llm

# Budget split for the 30 s end-to-end limit
YOUTUBE_TIMEOUT_SECONDS = 6.0
TRANSCRIPT_TIMEOUT_SECONDS = 6.0
LLM_TIMEOUT_SECONDS = 23.0


class MissingConfigError(Exception):
    """A required API key is not configured"""


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise MissingConfigError(f"{name} is not configured on the server")
    return value


def import_from_youtube(video_id: str) -> Dict[str, Any]:
    youtube_key = _require_env("YOUTUBE_API_KEY")
    anthropic_key = _require_env("ANTHROPIC_API_KEY")
    model = os.getenv("ANTHROPIC_MODEL", "").strip() or DEFAULT_MODEL

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

    extraction = call_llm(metadata, transcript, anthropic_key, model, LLM_TIMEOUT_SECONDS)
    draft, flags = build_draft(extraction, metadata)
    draft["video_url"] = youtube_client.canonical_video_url(video_id)

    return {
        **draft,
        "field_flags": flags,
        "duplicate_of": None,
        "source": {
            "video_id": video_id,
            "title": metadata.get("title", ""),
            "channel": metadata.get("channel", ""),
            "transcript_used": transcript is not None,
        },
    }
