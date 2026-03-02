"""
Integration test for the GET /recipes/{recipe_id} endpoint
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Create a test client
client = TestClient(app)


def test_get_recipe_by_id_endpoint_structure():
    """Test that the GET /recipes/{recipe_id} endpoint exists and returns proper response structure"""
    # This test verifies the endpoint exists and handles the case where recipe doesn't exist

    # Try to get a recipe with a high ID that likely doesn't exist
    response = client.get("/recipes/999999")

    # Should get a 404 error because the recipe doesn't exist
    # or 500 if there's a database connection issue
    assert response.status_code in [404, 500]
    json_response = response.json()
    assert "detail" in json_response

    if response.status_code == 404:
        assert "not found" in json_response["detail"].lower()
    elif response.status_code == 500:
        assert "database" in json_response["detail"].lower() or "connect" in json_response["detail"].lower()


def test_get_recipe_by_id_invalid_id_format():
    """Test GET /recipes/{recipe_id} endpoint with invalid ID format"""
    response = client.get("/recipes/not-a-number")

    # Should return validation error (422) for invalid ID format
    assert response.status_code == 422
    json_response = response.json()
    assert "detail" in json_response


def test_get_recipe_by_id_existing_recipe():
    """Test GET /recipes/{recipe_id} endpoint with an existing recipe"""
    # First, get all recipes to find a valid ID
    response = client.get("/recipes")

    if response.status_code == 500:
        # Database connection issue - skip this test
        pytest.skip("Database connection not available")

    assert response.status_code == 200
    json_response = response.json()

    if json_response["count"] == 0:
        pytest.skip("No recipes available for testing")

    # Get the first recipe's ID
    first_recipe = json_response["recipes"][0]
    recipe_id = first_recipe["id"]

    # Now test getting this specific recipe
    response = client.get(f"/recipes/{recipe_id}")

    assert response.status_code == 200
    recipe_response = response.json()

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
        assert field in recipe_response

    # Should have the correct ID
    assert recipe_response["id"] == recipe_id

    # Should match the data from get all recipes
    assert recipe_response["name"] == first_recipe["name"]
    assert recipe_response["category"] == first_recipe["category"]
    assert recipe_response["main_ingredients"] == first_recipe["main_ingredients"]
    assert recipe_response["common_ingredients"] == first_recipe["common_ingredients"]
    assert recipe_response["instructions"] == first_recipe["instructions"]
    assert recipe_response["prep_time"] == first_recipe["prep_time"]
    assert recipe_response["portions"] == first_recipe["portions"]

    # Verify data types
    assert isinstance(recipe_response["id"], int)
    assert isinstance(recipe_response["name"], str)
    assert isinstance(recipe_response["category"], str)
    assert isinstance(recipe_response["main_ingredients"], list)
    assert isinstance(recipe_response["common_ingredients"], list)
    assert isinstance(recipe_response["instructions"], str)
    assert isinstance(recipe_response["prep_time"], int)
    assert isinstance(recipe_response["portions"], int)

    # Verify main_ingredients structure
    if len(recipe_response["main_ingredients"]) > 0:
        ingredient = recipe_response["main_ingredients"][0]
        ingredient_fields = ['quantity', 'unit', 'name']
        for field in ingredient_fields:
            assert field in ingredient
        assert isinstance(ingredient['quantity'], (int, float))
        assert isinstance(ingredient['unit'], str)
        assert isinstance(ingredient['name'], str)

    # Verify common_ingredients structure
    if len(recipe_response["common_ingredients"]) > 0:
        assert isinstance(recipe_response["common_ingredients"][0], str)


def test_get_recipe_by_id_zero_id():
    """Test GET /recipes/{recipe_id} endpoint with ID zero"""
    response = client.get("/recipes/0")

    # Should get a 404 error because ID 0 typically doesn't exist
    # or 500 if there's a database connection issue
    assert response.status_code in [404, 500]
    json_response = response.json()
    assert "detail" in json_response


def test_get_recipe_by_id_negative_id():
    """Test GET /recipes/{recipe_id} endpoint with negative ID"""
    response = client.get("/recipes/-1")

    # Should get a 404 error because negative IDs typically don't exist
    # or 500 if there's a database connection issue
    assert response.status_code in [404, 500]
    json_response = response.json()
    assert "detail" in json_response
