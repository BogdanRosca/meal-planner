"""
Recipe import endpoints: build a reviewable recipe draft from an external source.
Nothing is saved here; the client saves the reviewed draft through POST /recipes.
"""
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException

from ..database_client import DatabaseClient
from ..models import RecipeDraftResponse, YoutubeImportRequest
from ..services import recipe_importer, youtube_client
from ..services.recipe_extractor import ExtractionError, ExtractionTimeoutError, NotARecipeError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes/import", tags=["recipe-import"])

IMPORT_FAILED_MESSAGE = "Import failed, try again or add manually."


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


def _find_duplicate(video_id: str) -> Optional[Dict[str, Any]]:
    """Duplicate check is best-effort: a database problem must not block the import"""
    db_client = DatabaseClient()
    try:
        if not db_client.connect():
            return None
        for recipe in db_client.find_recipes_by_video_id(video_id):
            if youtube_client.parse_video_id(recipe["video_url"] or "") == video_id:
                return {"id": recipe["id"], "name": recipe["name"]}
        return None
    except Exception as e:
        logger.warning("Duplicate check failed for %s: %s", video_id, e)
        return None
    finally:
        db_client.disconnect()


@router.post("/youtube")
def import_recipe_from_youtube(request: YoutubeImportRequest):
    """Fetch a YouTube video's metadata + transcript and return an AI-extracted recipe draft"""
    video_id = youtube_client.parse_video_id(request.url)

    try:
        draft = recipe_importer.import_from_youtube(video_id)
    except recipe_importer.MissingConfigError as e:
        raise _error(503, "not_configured", str(e))
    except youtube_client.VideoNotFoundError:
        raise _error(404, "video_not_found", "Video not found or not public.")
    except NotARecipeError:
        raise _error(422, "not_a_recipe", "We couldn't find a recipe in this video.")
    except (youtube_client.YoutubeTimeoutError, ExtractionTimeoutError) as e:
        logger.error("YouTube import timed out for %s: %s", video_id, e)
        raise _error(504, "timeout", IMPORT_FAILED_MESSAGE)
    except (youtube_client.YoutubeApiError, ExtractionError) as e:
        logger.error("YouTube import failed for %s: %s", video_id, e)
        raise _error(502, "upstream_error", IMPORT_FAILED_MESSAGE)
    except Exception as e:
        logger.exception("Unexpected YouTube import error for %s", video_id)
        raise _error(500, "internal_error", f"Error importing recipe: {str(e)}")

    draft["duplicate_of"] = _find_duplicate(video_id)
    return {"status": "success", "draft": RecipeDraftResponse.model_validate(draft).model_dump()}
