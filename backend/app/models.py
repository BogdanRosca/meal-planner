"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Literal
from .services.facebook_client import parse_reference as parse_facebook_reference
from .services.instagram_client import parse_shortcode
from .services.youtube_client import parse_video_id


class Ingredient(BaseModel):
    quantity: float
    unit: str
    name: str


class RecipeCreate(BaseModel):
    name: str
    category: str
    main_ingredients: List[Ingredient]
    common_ingredients: Optional[List[str]] = []
    instructions: str
    prep_time: int
    portions: int
    foto_url: Optional[str] = None
    video_url: Optional[str] = None


class RecipeResponse(BaseModel):
    id: int
    name: str
    category: str
    main_ingredients: List[Ingredient]
    common_ingredients: Optional[List[str]] = []
    instructions: str
    prep_time: int
    portions: int
    foto_url: Optional[str] = None
    video_url: Optional[str] = None


class NewRecipeResponse(BaseModel):
    name: str
    category: str
    prep_time: int
    portions: int


class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    main_ingredients: Optional[List[Ingredient]] = None
    common_ingredients: Optional[List[str]] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None
    portions: Optional[int] = None
    foto_url: Optional[str] = None   
    video_url: Optional[str] = None   


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email:
            raise ValueError("Enter a valid email address")
        return email


class UserResponse(BaseModel):
    id: int
    email: str


class MealPlanCreate(BaseModel):
    week_start: str
    day_of_week: int
    meal_slot: str
    recipe_id: int


class MealPlanEntryResponse(BaseModel):
    id: int
    week_start: str
    day_of_week: int
    meal_slot: str
    recipe_id: int
    recipe_name: str
    recipe_category: str
    recipe_foto_url: Optional[str] = None


class YoutubeImportRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def must_be_youtube_video_url(cls, value: str) -> str:
        if not parse_video_id(value):
            raise ValueError("Not a valid YouTube video URL")
        return value.strip()


class InstagramImportRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def must_be_instagram_post_url(cls, value: str) -> str:
        if not parse_shortcode(value):
            raise ValueError("Not a valid Instagram reel URL")
        return value.strip()


class FacebookImportRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def must_be_facebook_video_url(cls, value: str) -> str:
        if not parse_facebook_reference(value):
            raise ValueError("Not a valid Facebook reel URL")
        return value.strip()


class DuplicateRecipe(BaseModel):
    id: int
    name: str


class ImportSource(BaseModel):
    platform: Literal["youtube", "instagram", "facebook"]
    video_id: str
    title: str
    channel: str
    transcript_used: bool


class RecipeDraftResponse(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    main_ingredients: Optional[List[Ingredient]] = None
    common_ingredients: Optional[List[str]] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None
    portions: Optional[int] = None
    foto_url: Optional[str] = None
    video_url: Optional[str] = None
    field_flags: Dict[str, Literal["missing", "estimated"]] = {}
    duplicate_of: Optional[DuplicateRecipe] = None
    source: ImportSource
