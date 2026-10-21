"""
Health check endpoints
"""
# [temp] trigger CI
from fastapi import APIRouter

# Create router for health endpoints
router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "healthy", "message": "Meal Planner API is running !"}
