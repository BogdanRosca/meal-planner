from fastapi.testclient import TestClient
from app.main import app

# Create a test client
client = TestClient(app)


def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")

    # Check that the response status code is 200 (OK)
    assert response.status_code == 200

    # Check that the response contains the expected JSON
    assert response.json() == {
        "status": "healthy",
        "message": "Meal Planner API is running !"
    }


def test_health_endpoint_response_format():
    """Test that the health endpoint returns valid JSON"""
    response = client.get("/health")

    # Check that we get JSON back
    assert response.headers["content-type"] == "application/json"

    # Check that the response has the required fields
    json_response = response.json()
    assert "status" in json_response
    assert "message" in json_response
    assert json_response["status"] == "healthy"
