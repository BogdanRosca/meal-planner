"""
Transcript lookup via youtube-transcript-api. Failures are non-fatal: the import
continues with metadata only.
"""
import logging
from typing import Optional

from youtube_transcript_api import YouTubeTranscriptApi

logger = logging.getLogger(__name__)


def _rank(transcript) -> tuple:
    # Manual captions beat auto-generated ones; English beats other languages
    return (transcript.is_generated, not transcript.language_code.startswith("en"))


def fetch_transcript(video_id: str) -> Optional[str]:
    try:
        transcripts = list(YouTubeTranscriptApi().list(video_id))
        if not transcripts:
            return None
        best = min(transcripts, key=_rank)
        text = " ".join(snippet.text for snippet in best.fetch())
        return text.strip() or None
    except Exception as e:
        logger.warning("Transcript unavailable for %s: %s", video_id, e)
        return None
