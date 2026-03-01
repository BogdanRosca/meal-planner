"""
Tests for database client get_all_recipes functionality
"""


class TestGetAllRecipes:
    """Test the get_all_recipes functionality"""

    def test_get_all_recipes(self, db_client):
        """Test that we can retrieve all recipes"""
        # Connect to database
        db_client.connect()

        # Get all recipes
        recipes = db_client.get_all_recipes()

        # Should be a list (even if empty)
        assert isinstance(recipes, list)

        # Check the structure of recipes if any exist
        if len(recipes) > 0:
            recipe = recipes[0]
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

            # Verify main_ingredients is a list of structured ingredients
            assert isinstance(recipe['main_ingredients'], list)
            if len(recipe['main_ingredients']) > 0:
                ingredient = recipe['main_ingredients'][0]
                ingredient_fields = ['quantity', 'unit', 'name']
                for field in ingredient_fields:
                    assert field in ingredient
                assert isinstance(ingredient['quantity'], (int, float))
                assert isinstance(ingredient['unit'], str)
                assert isinstance(ingredient['name'], str)

            # Verify common_ingredients is a list of strings
            assert isinstance(recipe['common_ingredients'], list)
            if len(recipe['common_ingredients']) > 0:
                assert isinstance(recipe['common_ingredients'][0], str)
