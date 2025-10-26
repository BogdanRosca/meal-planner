"""
Integration tests for PATCH /recipes/{recipe_id} endpoint
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database_client import DatabaseClient


# Create a test client
client = TestClient(app)


class TestUpdateRecipeEndpointIntegration:
    """Test the PATCH /recipes/{recipe_id} endpoint with real database"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self):
        """Setup and cleanup for each test"""
        # This runs before each test
        self.db_client = DatabaseClient()
        self.db_client.connect()
        self.created_recipe_ids = []
        
        yield
        
        # This runs after each test - cleanup any test data
        for recipe_id in self.created_recipe_ids:
            try:
                self.db_client.delete_recipe(recipe_id)
            except Exception as e:
                print(f"Warning: Failed to delete recipe {recipe_id}: {e}")
        
        self.db_client.disconnect()
    
    def test_patch_recipe_success(self):
        """Test successful recipe update via PATCH endpoint"""
        # First create a recipe
        original_recipe = self.db_client.add_recipe(
            name="Original Recipe",
            category="dinner",
            main_ingredients=[{"quantity": 250, "unit": "g", "name": "pasta"}],
            common_ingredients=["salt", "pepper"],
            instructions="Cook the pasta",
            prep_time=20,
            portions=4,
            foto_url="www.my-foto-url.net"
        )
        
        recipe_id = original_recipe['id']
        self.created_recipe_ids.append(recipe_id)  # Track for cleanup
        
        # Update the recipe via PATCH endpoint
        update_data = {
            "name": "Updated Recipe Name",
            "prep_time": 30,
            "instructions": "Cook the pasta well"
        }
        
        response = client.patch(f"/recipes/{recipe_id}", json=update_data)
        
        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        
        assert json_response["id"] == recipe_id
        assert json_response["name"] == "Updated Recipe Name"
        assert json_response["prep_time"] == 30
        assert json_response["instructions"] == "Cook the pasta well"
        # Unchanged fields
        assert json_response["category"] == "dinner"
        assert json_response["portions"] == 4
        assert json_response["main_ingredients"] == [{"quantity": 250, "unit": "g", "name": "pasta"}]
        assert json_response["common_ingredients"] == ["salt", "pepper"]
    
    def test_patch_recipe_with_ingredients(self):
        """Test updating recipe ingredients via PATCH endpoint"""
        # First create a recipe
        original_recipe = self.db_client.add_recipe(
            name="Test Recipe",
            category="lunch",
            main_ingredients=[{"quantity": 250, "unit": "g", "name": "pasta"}],
            common_ingredients=["salt"],
            instructions="Cook it",
            prep_time=15,
            portions=2,
            foto_url="www.my-foto-url.net"
        )
        
        recipe_id = original_recipe['id']
        self.created_recipe_ids.append(recipe_id)  # Track for cleanup
        
        # Update ingredients via PATCH endpoint
        update_data = {
            "main_ingredients": [
                {"quantity": 200, "unit": "g", "name": "rice"},
                {"quantity": 150, "unit": "g", "name": "chicken"}
            ],
            "common_ingredients": ["garlic", "onion"]
        }
        
        response = client.patch(f"/recipes/{recipe_id}", json=update_data)
        
        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        
        assert len(json_response["main_ingredients"]) == 2
        assert json_response["main_ingredients"][0]["name"] == "rice"
        assert json_response["main_ingredients"][1]["name"] == "chicken"
        assert json_response["common_ingredients"] == ["garlic", "onion"]
        # Unchanged fields
        assert json_response["name"] == "Test Recipe"
        assert json_response["category"] == "lunch"
        assert json_response["prep_time"] == 15
    
    def test_patch_recipe_not_found(self):
        """Test PATCH with non-existent recipe ID"""
        update_data = {"name": "This should fail"}
        
        response = client.patch("/recipes/99999", json=update_data)
        
        # Assertions
        assert response.status_code == 404
        json_response = response.json()
        assert "Recipe with ID 99999 not found" in json_response["detail"]
    
    def test_patch_recipe_empty_payload(self):
        """Test PATCH with empty payload"""
        # First create a recipe
        original_recipe = self.db_client.add_recipe(
            name="Test Recipe",
            category="dinner",
            main_ingredients=[{"quantity": 250, "unit": "g", "name": "pasta"}],
            common_ingredients=["salt"],
            instructions="Cook it",
            prep_time=20,
            portions=2,
            foto_url="www.my-foto-url.net"
        )
        
        recipe_id = original_recipe['id']
        self.created_recipe_ids.append(recipe_id)  # Track for cleanup
        
        # Try to update with empty payload
        update_data = {}
        
        response = client.patch(f"/recipes/{recipe_id}", json=update_data)
        
        # Assertions
        assert response.status_code == 400
        json_response = response.json()
        assert "No fields provided for update" in json_response["detail"]
    
    def test_patch_recipe_invalid_data_types(self):
        """Test PATCH with invalid data types"""
        # First create a recipe
        original_recipe = self.db_client.add_recipe(
            name="Test Recipe",
            category="dinner",
            main_ingredients=[{"quantity": 250, "unit": "g", "name": "pasta"}],
            common_ingredients=["salt"],
            instructions="Cook it",
            prep_time=20,
            portions=2,
            foto_url="www.my-foto-url.net"
        )
        
        recipe_id = original_recipe['id']
        self.created_recipe_ids.append(recipe_id)  # Track for cleanup
        
        # Try to update with invalid data types
        update_data = {
            "prep_time": "not-a-number",
            "portions": "also-not-a-number"
        }
        
        response = client.patch(f"/recipes/{recipe_id}", json=update_data)
        
        # Assertions
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response
    
    def test_patch_recipe_partial_update(self):
        """Test PATCH with only one field update"""
        # First create a recipe
        original_recipe = self.db_client.add_recipe(
            name="Original Recipe",
            category="breakfast",
            main_ingredients=[{"quantity": 100, "unit": "g", "name": "oats"}],
            common_ingredients=["milk"],
            instructions="Mix and serve",
            prep_time=5,
            portions=1,
            foto_url="www.my-foto-url.net"
        )
        
        recipe_id = original_recipe['id']
        self.created_recipe_ids.append(recipe_id)  # Track for cleanup
        
        # Update only the name
        update_data = {"name": "Updated Recipe Name Only"}
        
        response = client.patch(f"/recipes/{recipe_id}", json=update_data)
        
        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        
        assert json_response["name"] == "Updated Recipe Name Only"
        # All other fields should remain unchanged
        assert json_response["category"] == "breakfast"
        assert json_response["main_ingredients"] == [{"quantity": 100, "unit": "g", "name": "oats"}]
        assert json_response["common_ingredients"] == ["milk"]
        assert json_response["instructions"] == "Mix and serve"
        assert json_response["prep_time"] == 5
        assert json_response["portions"] == 1
    
    def test_patch_recipe_invalid_ingredient_structure(self):
        """Test PATCH with invalid ingredient structure"""
        # First create a recipe
        original_recipe = self.db_client.add_recipe(
            name="Test Recipe",
            category="dinner",
            main_ingredients=[{"quantity": 250, "unit": "g", "name": "pasta"}],
            common_ingredients=["salt"],
            instructions="Cook it",
            prep_time=20,
            portions=2,
            foto_url="www.my-foto-url.net"
        )
        
        recipe_id = original_recipe['id']
        self.created_recipe_ids.append(recipe_id)  # Track for cleanup
        
        # Try to update with invalid ingredient structure
        update_data = {
            "main_ingredients": [
                {"quantity": "invalid", "unit": "g"}  # Missing 'name', invalid quantity
            ]
        }
        
        response = client.patch(f"/recipes/{recipe_id}", json=update_data)
        
        # Assertions
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response
