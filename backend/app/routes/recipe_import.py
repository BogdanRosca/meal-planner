"""
Recipe import endpoints: build a reviewable recipe draft from an external video source.
Nothing is saved here; the client saves the reviewed draft through POST /recipes.
"""
import logging
from typing import Any, Callable, Dict, Optional

from fastapi import APIRouter, HTTPException

from ..database_client import DatabaseClient
from ..models import InstagramImportRequest, RecipeDraftResponse, YoutubeImportRequest
from ..services import instagram_client, recipe_importer, youtube_client
from ..services.recipe_extractor import ExtractionError, ExtractionTimeoutError, NotARecipeError
from ..services.source_errors import SourceFetchError, SourceTimeoutError, VideoNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes/import", tags=["recipe-import"])

IMPORT_FAILED_MESSAGE = "Import failed, try again or add manually."


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


def _find_duplicate(source_id: str, parse_id: Callable[[str], Optional[str]]) -> Optional[Dict[str, Any]]:
    """Duplicate check is best-effort: a database problem must not block the import"""
    db_client = DatabaseClient()
    try:
        if not db_client.connect():
            return None
        for recipe in db_client.find_recipes_by_video_id(source_id):
            if parse_id(recipe["video_url"] or "") == source_id:
                return {"id": recipe["id"], "name": recipe["name"]}
        return None
    except Exception as e:
        logger.warning("Duplicate check failed for %s: %s", source_id, e)
        return None
    finally:
        db_client.disconnect()


def _run_import(import_fn: Callable[[str], Dict[str, Any]], source_id: str,
                parse_id: Callable[[str], Optional[str]]) -> Dict[str, Any]:
    """Run a platform import and map its failures onto HTTP errors with a stable code"""
    try:
        draft = import_fn(source_id)
    except recipe_importer.MissingConfigError as e:
        raise _error(503, "not_configured", str(e))
    except VideoNotFoundError:
        raise _error(404, "video_not_found", "Video not found or not public.")
    except NotARecipeError:
        raise _error(422, "not_a_recipe", "We couldn't find a recipe in this video.")
    except (SourceTimeoutError, ExtractionTimeoutError) as e:
        logger.error("Import timed out for %s: %s", source_id, e)
        raise _error(504, "timeout", IMPORT_FAILED_MESSAGE)
    except (SourceFetchError, ExtractionError) as e:
        logger.error("Import failed for %s: %s", source_id, e)
        raise _error(502, "upstream_error", IMPORT_FAILED_MESSAGE)
    except Exception as e:
        logger.exception("Unexpected import error for %s", source_id)
        raise _error(500, "internal_error", f"Error importing recipe: {str(e)}")

    draft["duplicate_of"] = _find_duplicate(source_id, parse_id)
    return {"status": "success", "draft": RecipeDraftResponse.model_validate(draft).model_dump()}


@router.post("/youtube")
def import_recipe_from_youtube(request: YoutubeImportRequest):
    """Fetch a YouTube video's metadata + transcript and return an AI-extracted recipe draft"""
    video_id = youtube_client.parse_video_id(request.url)
    return _run_import(recipe_importer.import_from_youtube, video_id, youtube_client.parse_video_id)


@router.post("/instagram")
def import_recipe_from_instagram(request: InstagramImportRequest):
    """Fetch an Instagram reel's caption + thumbnail and return an AI-extracted recipe draft"""
    shortcode = instagram_client.parse_shortcode(request.url)
    return _run_import(recipe_importer.import_from_instagram, shortcode, instagram_client.parse_shortcode)
