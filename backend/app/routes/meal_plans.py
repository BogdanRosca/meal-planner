"""
Meal plan endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from ..database_client import DatabaseClient
from ..models import MealPlanCreate


router = APIRouter(prefix="/meal-plans", tags=["meal-plans"])


@router.get("")
def get_meal_plan(week_start: str = Query(..., description="Monday date in YYYY-MM-DD format")):
    """Get all meal plan entries for a given week"""
    db_client = DatabaseClient()

    try:
        if not db_client.connect():
            raise HTTPException(status_code=500, detail="Failed to connect to database")

        entries = db_client.get_meal_plan_by_week(week_start)

        return {"status": "success", "entries": entries}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving meal plan: {str(e)}")

    finally:
        db_client.disconnect()


@router.post("")
def create_meal_plan_entry(entry: MealPlanCreate):
    """Create or update a meal plan entry"""
    db_client = DatabaseClient()

    try:
        if not db_client.connect():
            raise HTTPException(status_code=500, detail="Failed to connect to database")

        result = db_client.add_meal_plan_entry(
            week_start=entry.week_start,
            day_of_week=entry.day_of_week,
            meal_slot=entry.meal_slot,
            recipe_id=entry.recipe_id,
        )

        return JSONResponse(status_code=201, content={"status": "success", "entry": result})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating meal plan entry: {str(e)}")

    finally:
        db_client.disconnect()


@router.delete("/{entry_id}")
def delete_meal_plan_entry(entry_id: int):
    """Delete a meal plan entry by ID"""
    db_client = DatabaseClient()

    try:
        if not db_client.connect():
            raise HTTPException(status_code=500, detail="Failed to connect to database")

        success = db_client.delete_meal_plan_entry(entry_id)

        if not success:
            raise HTTPException(status_code=404, detail=f"Meal plan entry with ID {entry_id} not found")

        return {"status": "success", "message": f"Meal plan entry {entry_id} deleted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting meal plan entry: {str(e)}")

    finally:
        db_client.disconnect()
