"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List


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


class RecipeResponse(BaseModel):
    id: int
    name: str
    category: str
    main_ingredients: List[Ingredient]
    common_ingredients: List[str]
    instructions: str
    prep_time: int
    portions: int
    foto_url: str


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
