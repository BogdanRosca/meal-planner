import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import health, recipes, meal_plans

# Create FastAPI app instance
app = FastAPI(title="Meal Planner API", version="1.0.0")

# Get frontend URL from environment variable
frontend_url = os.getenv("REACT_APP_FRONTEND_URL", "http://localhost:3000")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(recipes.router)
app.include_router(meal_plans.router)
