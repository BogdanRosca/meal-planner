"""
Tests for database client get_recipe_by_id functionality
"""
import pytest
from app.database_client import DatabaseClient


class TestGetRecipeById:
    """Test the get_recipe_by_id functionality"""

    def test_get_recipe_by_id_success(self, db_client):
        """Test that we can retrieve a specific recipe by ID"""
        # Connect to database
        db_client.connect()

        # First, get all recipes to find a valid ID
        recipes = db_client.get_all_recipes()

        # Skip test if no recipes exist
        if len(recipes) == 0:
            pytest.skip("No recipes available for testing")

        # Get the first recipe's ID
        first_recipe = recipes[0]
        recipe_id = first_recipe['id']

        # Now test get_recipe_by_id with this valid ID
        recipe = db_client.get_recipe_by_id(recipe_id)

        # Should return the recipe
        assert recipe is not None
        assert isinstance(recipe, dict)

        # Should have the correct ID
        assert recipe['id'] == recipe_id

        # Should have all required fields
        required_fields = [
            'id',
            'name',
            'category',
            'main_ingredients',
            'common_ingredients',
            'instructions',
            'prep_time',
            'portions']
        for field in required_fields:
            assert field in recipe

        # Should match the data from get_all_recipes
        assert recipe['name'] == first_recipe['name']
        assert recipe['category'] == first_recipe['category']
        assert recipe['main_ingredients'] == first_recipe['main_ingredients']
        assert recipe['common_ingredients'] == first_recipe['common_ingredients']
        assert recipe['instructions'] == first_recipe['instructions']
        assert recipe['prep_time'] == first_recipe['prep_time']
        assert recipe['portions'] == first_recipe['portions']

        # Verify main_ingredients structure
        assert isinstance(recipe['main_ingredients'], list)
        if len(recipe['main_ingredients']) > 0:
            ingredient = recipe['main_ingredients'][0]
            ingredient_fields = ['quantity', 'unit', 'name']
            for field in ingredient_fields:
                assert field in ingredient
            assert isinstance(ingredient['quantity'], (int, float))
            assert isinstance(ingredient['unit'], str)
            assert isinstance(ingredient['name'], str)

        # Verify common_ingredients structure
        assert isinstance(recipe['common_ingredients'], list)
        if len(recipe['common_ingredients']) > 0:
            assert isinstance(recipe['common_ingredients'][0], str)

    def test_get_recipe_by_id_not_found(self, db_client):
        """Test get_recipe_by_id with non-existent ID"""
        # Connect to database
        db_client.connect()

        # Use a very high ID that shouldn't exist
        recipe = db_client.get_recipe_by_id(999999)

        # Should return None
        assert recipe is None

    def test_get_recipe_by_id_not_connected(self):
        """Test get_recipe_by_id when not connected to database"""
        client = DatabaseClient()
        # Don't connect to database

        with pytest.raises(Exception) as exc_info:
            client.get_recipe_by_id(1)

        assert "Not connected to database" in str(exc_info.value)
