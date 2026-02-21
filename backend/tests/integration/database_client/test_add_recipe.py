"""
Tests for database client add_recipe functionality
"""
import pytest
from .conftest import TEST_RECIPE_DATA


class TestAddRecipe:
    """Test the add_recipe functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self, db_client):
        """Setup and cleanup for each test"""
        # This runs before each test
        self.db_client = db_client
        self.db_client.connect()
        self.created_recipe_ids = []  # Track recipes created during tests
        
        yield
        
        # This runs after each test - cleanup any test data
        for recipe_id in self.created_recipe_ids:
            try:
                self.db_client.delete_recipe(recipe_id)
            except Exception as e:
                print(f"Warning: Failed to delete recipe {recipe_id}: {e}")
    
    def test_add_recipe(self):
        """Test that we can add a new recipe"""
        # Get initial recipe count
        initial_recipes = self.db_client.get_all_recipes()
        initial_count = len(initial_recipes)
        
        # Add the new recipe
        added_recipe = self.db_client.add_recipe(
            name=TEST_RECIPE_DATA["name"],
            category=TEST_RECIPE_DATA["category"],
            main_ingredients=TEST_RECIPE_DATA["main_ingredients"],
            common_ingredients=TEST_RECIPE_DATA["common_ingredients"],
            instructions=TEST_RECIPE_DATA["instructions"],
            prep_time=TEST_RECIPE_DATA["prep_time"],
            portions=TEST_RECIPE_DATA["portions"],
            foto_url="www.my-foto-url.net",
            video_url=None
        )
        
        # Track the created recipe ID for cleanup
        recipe_id = added_recipe['id']
        self.created_recipe_ids.append(recipe_id)
        
        # Validate the returned recipe structure
        assert isinstance(added_recipe, dict)
        assert 'id' in added_recipe
        assert added_recipe['name'] == TEST_RECIPE_DATA["name"]
        assert added_recipe['category'] == TEST_RECIPE_DATA["category"]
        assert added_recipe['instructions'] == TEST_RECIPE_DATA["instructions"]
        assert added_recipe['prep_time'] == TEST_RECIPE_DATA["prep_time"]
        assert added_recipe['portions'] == TEST_RECIPE_DATA["portions"]
        
        # Validate main_ingredients structure
        assert isinstance(added_recipe['main_ingredients'], list)
        assert len(added_recipe['main_ingredients']) == len(TEST_RECIPE_DATA["main_ingredients"])
        for i, ingredient in enumerate(added_recipe['main_ingredients']):
            expected_ingredient = TEST_RECIPE_DATA["main_ingredients"][i]
            assert ingredient['name'] == expected_ingredient['name']
            assert ingredient['unit'] == expected_ingredient['unit']
            assert ingredient['quantity'] == expected_ingredient['quantity']
        
        # Validate common_ingredients
        assert isinstance(added_recipe['common_ingredients'], list)
        assert set(added_recipe['common_ingredients']) == set(TEST_RECIPE_DATA["common_ingredients"])
        
        # Verify the recipe was actually added to the database
        updated_recipes = self.db_client.get_all_recipes()
        assert len(updated_recipes) == initial_count + 1
        
        # Find the newly added recipe in the list
        new_recipe_found = False
        for recipe in updated_recipes:
            if recipe['id'] == added_recipe['id']:
                new_recipe_found = True
                assert recipe['name'] == TEST_RECIPE_DATA["name"]
                break
        assert new_recipe_found, "Newly added recipe not found in database"
