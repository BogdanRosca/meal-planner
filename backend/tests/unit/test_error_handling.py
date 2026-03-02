"""
Unit tests for error handling and edge cases
"""
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.database_client import DatabaseClient
from .conftest import (CREATE_RECIPE_DATA, EDGE_CASE_RECIPE_DATA,
                       UNICODE_RECIPE_DATA, EMPTY_RECIPE_DATA, COMPLEX_RECIPE_DATA)


# Create a test client
client = TestClient(app)


class TestErrorHandling:
    """Test error handling across the application"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_recipes_unexpected_exception(self, mock_db_client_class):
        """Test handling of unexpected exceptions in get_all_recipes"""
        # Setup mock to raise unexpected exception
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_all_recipes.side_effect = RuntimeError("Unexpected error")

        # Make request
        response = client.get("/recipes")

        # Should handle gracefully
        assert response.status_code == 500
        json_response = response.json()
        assert "Error retrieving recipes" in json_response["detail"]
        assert "Unexpected error" in json_response["detail"]

        # Ensure cleanup happens
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_create_recipe_unexpected_exception(self, mock_db_client_class):
        """Test handling of unexpected exceptions in create_recipe"""
        # Setup mock to raise unexpected exception
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.add_recipe.side_effect = RuntimeError("Database exploded")

        # Make request
        response = client.post("/recipes", json=CREATE_RECIPE_DATA)

        # Should handle gracefully
        assert response.status_code == 500
        json_response = response.json()
        assert "Error creating recipe" in json_response["detail"]
        assert "Database exploded" in json_response["detail"]

        # Ensure cleanup happens
        mock_db_client.disconnect.assert_called_once()


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_recipes_empty_result(self, mock_db_client_class):
        """Test handling when database returns empty recipe list"""
        # Setup mock to return empty list
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_all_recipes.return_value = []

        # Make request
        response = client.get("/recipes")

        # Should handle gracefully
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["status"] == "success"
        assert json_response["count"] == 0
        assert json_response["recipes"] == []

    def test_create_recipe_with_edge_case_values(self):
        """Test recipe creation with edge case values"""
        with patch('app.routes.recipes.DatabaseClient') as mock_db_client_class:
            mock_db_client = Mock()
            mock_db_client_class.return_value = mock_db_client
            mock_db_client.connect.return_value = True
            mock_db_client.add_recipe.return_value = {"id": 1, **EDGE_CASE_RECIPE_DATA}

            response = client.post("/recipes", json=EDGE_CASE_RECIPE_DATA)

            # Should handle edge cases successfully
            assert response.status_code == 201

    def test_create_recipe_with_unicode_characters(self):
        """Test recipe creation with unicode characters"""
        with patch('app.routes.recipes.DatabaseClient') as mock_db_client_class:
            mock_db_client = Mock()
            mock_db_client_class.return_value = mock_db_client
            mock_db_client.connect.return_value = True
            mock_db_client.add_recipe.return_value = {"id": 1, **UNICODE_RECIPE_DATA}

            response = client.post("/recipes", json=UNICODE_RECIPE_DATA)

            # Should handle unicode successfully
            assert response.status_code == 201

    def test_create_recipe_with_many_ingredients(self):
        """Test recipe creation with many ingredients"""
        with patch('app.routes.recipes.DatabaseClient') as mock_db_client_class:
            mock_db_client = Mock()
            mock_db_client_class.return_value = mock_db_client
            mock_db_client.connect.return_value = True
            mock_db_client.add_recipe.return_value = {"id": 1, **COMPLEX_RECIPE_DATA}

            response = client.post("/recipes", json=COMPLEX_RECIPE_DATA)

            # Should handle many ingredients successfully
            assert response.status_code == 201


class TestDatabaseClientEdgeCases:
    """Test DatabaseClient edge cases"""

    @patch.dict('os.environ', {}, clear=True)  # Clear all environment variables
    @patch('app.database_client.load_dotenv')  # Prevent loading .env file
    def test_database_client_with_none_values(self, mock_load_dotenv):
        """Test DatabaseClient initialization with None values"""
        # Test that None values are handled gracefully
        client = DatabaseClient(
            host=None,
            port=None,
            database=None,
            user=None,
            password=None
        )

        # Should get None values since no env vars are set and explicit params are None
        # Note: os.getenv returns None when env var doesn't exist
        assert client.host is None
        assert client.port is None
        assert client.database is None
        assert client.user is None
        assert client.password is None

    def test_add_recipe_with_empty_json(self):
        """Test add_recipe with empty main_ingredients"""
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()

        # Mock successful response using constants
        mock_cursor.fetchone.return_value = (
            1, EMPTY_RECIPE_DATA["name"], EMPTY_RECIPE_DATA["category"], 
            EMPTY_RECIPE_DATA["main_ingredients"], EMPTY_RECIPE_DATA["common_ingredients"], 
            EMPTY_RECIPE_DATA["instructions"], EMPTY_RECIPE_DATA["prep_time"], 
            EMPTY_RECIPE_DATA["portions"], EMPTY_RECIPE_DATA["foto_url"],
            EMPTY_RECIPE_DATA["video_url"]
        )

        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection

        with patch.object(client, 'is_connected', return_value=True):
            result = client.add_recipe(**EMPTY_RECIPE_DATA)

        # Should handle empty ingredients successfully
        assert result['name'] == EMPTY_RECIPE_DATA["name"]
        assert result['main_ingredients'] == []
        assert result['common_ingredients'] == []
