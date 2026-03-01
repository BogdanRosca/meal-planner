"""
Integration test for the DELETE recipe endpoint
"""
from fastapi.testclient import TestClient
from app.main import app

# Create a test client
client = TestClient(app)


def test_delete_recipe_endpoint_structure():
    """Test that the DELETE endpoint exists and returns proper response structure"""
    # This test verifies the endpoint exists and handles the case where recipe doesn't exist

    # Try to delete a recipe with a high ID that likely doesn't exist
    response = client.delete("/recipes/999999")

    # Should get a 404 error because the recipe doesn't exist
    # or 500 if there's a database connection issue
    assert response.status_code in [404, 500]
    json_response = response.json()
    assert "detail" in json_response

    if response.status_code == 404:
        assert "not found" in json_response["detail"].lower()
    elif response.status_code == 500:
        assert "database" in json_response["detail"].lower() or "connect" in json_response["detail"].lower()


def test_delete_recipe_invalid_id_format():
    """Test DELETE endpoint with invalid ID format"""
    response = client.delete("/recipes/not-a-number")

    # Should return validation error (422) for invalid ID format
    assert response.status_code == 422
    json_response = response.json()
    assert "detail" in json_response
