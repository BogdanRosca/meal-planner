"""
Unit tests for Pydantic models
"""
import pytest
from pydantic import ValidationError
from app.models import Ingredient, RecipeCreate, RecipeResponse


class TestIngredientModel:
    """Test the Ingredient Pydantic model"""

    def test_valid_ingredient(self):
        """Test creating a valid ingredient"""
        ingredient = Ingredient(
            quantity=250.0,
            unit="g",
            name="pasta"
        )

        assert ingredient.quantity == 250.0
        assert ingredient.unit == "g"
        assert ingredient.name == "pasta"

    def test_ingredient_with_integer_quantity(self):
        """Test that integer quantities are accepted and converted to float"""
        ingredient = Ingredient(
            quantity=2,  # integer
            unit="pcs",
            name="eggs"
        )

        assert ingredient.quantity == 2.0  # should be converted to float
        assert isinstance(ingredient.quantity, float)

    def test_ingredient_missing_required_fields(self):
        """Test that missing required fields raise ValidationError"""
        with pytest.raises(ValidationError) as exc_info:
            Ingredient(quantity=250.0, unit="g")  # missing name

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["type"] == "missing"
        assert "name" in errors[0]["loc"]

    def test_ingredient_invalid_quantity_type(self):
        """Test that invalid quantity types raise ValidationError"""
        with pytest.raises(ValidationError) as exc_info:
            Ingredient(
                quantity="not-a-number",
                unit="g",
                name="pasta"
            )

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert "quantity" in errors[0]["loc"]

    def test_ingredient_empty_strings(self):
        """Test validation with empty strings"""
        # Empty unit and name should be allowed if they are strings
        ingredient = Ingredient(
            quantity=1.0,
            unit="",  # empty string
            name=""   # empty string
        )

        assert ingredient.unit == ""
        assert ingredient.name == ""


class TestRecipeCreateModel:
    """Test the RecipeCreate Pydantic model"""

    def test_valid_recipe_create(self):
        """Test creating a valid recipe"""
        recipe = RecipeCreate(
            name="Test Recipe",
            category="dinner",
            main_ingredients=[
                Ingredient(quantity=250, unit="g", name="pasta"),
                Ingredient(quantity=2, unit="tbsp", name="olive oil")
            ],
            common_ingredients=["salt", "pepper"],
            instructions="Cook and serve",
            prep_time=30,
            portions=4,
            foto_url="https://example.com/recipe.jpg"
        )

        assert recipe.name == "Test Recipe"
        assert recipe.category == "dinner"
        assert len(recipe.main_ingredients) == 2
        assert len(recipe.common_ingredients) == 2
        assert recipe.instructions == "Cook and serve"
        assert recipe.prep_time == 30
        assert recipe.portions == 4
        assert recipe.foto_url == "https://example.com/recipe.jpg"

    def test_recipe_create_without_foto_url(self):
        """Test recipe creation without foto_url (should default to None)"""
        recipe = RecipeCreate(
            name="Test Recipe",
            category="dinner",
            main_ingredients=[],
            common_ingredients=[],
            instructions="Cook and serve",
            prep_time=30,
            portions=4
        )

        assert recipe.foto_url is None

    def test_recipe_create_empty_ingredients(self):
        """Test recipe with empty ingredient lists"""
        recipe = RecipeCreate(
            name="Simple Recipe",
            category="snack",
            main_ingredients=[],  # empty list
            common_ingredients=[],  # empty list
            instructions="No cooking required",
            prep_time=0,
            portions=1
        )

        assert len(recipe.main_ingredients) == 0
        assert len(recipe.common_ingredients) == 0

    def test_recipe_create_invalid_main_ingredients(self):
        """Test validation with invalid main ingredients"""
        with pytest.raises(ValidationError) as exc_info:
            RecipeCreate(
                name="Test Recipe",
                category="dinner",
                main_ingredients=[
                    {"quantity": "invalid", "unit": "g", "name": "pasta"}  # invalid quantity
                ],
                common_ingredients=["salt"],
                instructions="Cook it",
                prep_time=30,
                portions=4
            )

        errors = exc_info.value.errors()
        assert len(errors) >= 1
        # Should have validation error for the main_ingredients


class TestRecipeResponseModel:
    """Test the RecipeResponse Pydantic model"""

    def test_valid_recipe_response(self):
        """Test creating a valid recipe response"""
        response = RecipeResponse(
            id=1,
            name="Test Recipe",
            category="dinner",
            main_ingredients=[
                Ingredient(quantity=250, unit="g", name="pasta")
            ],
            common_ingredients=["salt", "pepper"],
            instructions="Cook and serve",
            prep_time=30,
            portions=4,
            foto_url="https://example.com/recipe.jpg"
        )

        assert response.id == 1
        assert response.name == "Test Recipe"
        assert isinstance(response.main_ingredients[0], Ingredient)
        assert response.foto_url == "https://example.com/recipe.jpg"

    def test_recipe_response_invalid_id(self):
        """Test that invalid ID types raise ValidationError"""
        with pytest.raises(ValidationError) as exc_info:
            RecipeResponse(
                id="not-a-number",  # should be int
                name="Test Recipe",
                category="dinner",
                main_ingredients=[],
                common_ingredients=[],
                instructions="Cook it",
                prep_time=30,
                portions=4,
                foto_url="www.my-foto-url.net"
            )

        errors = exc_info.value.errors()
        print(errors)
        assert len(errors) == 1
        assert "id" in errors[0]["loc"]
