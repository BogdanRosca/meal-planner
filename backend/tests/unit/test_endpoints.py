"""
Unit tests for API endpoints using mocks
"""
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app
from .conftest import (
    SAMPLE_RECIPE_1, SAMPLE_RECIPE_2, CREATE_RECIPE_DATA,
    UPDATE_RECIPE_DATA, UPDATE_RECIPE_WITH_INGREDIENTS_DATA,
    UPDATED_RECIPE_RESPONSE, UPDATED_RECIPE_WITH_INGREDIENTS_RESPONSE,
    INVALID_RECIPE_DATA_MISSING_FIELDS, INVALID_RECIPE_DATA_INVALID_INGREDIENT,
    INVALID_UPDATE_DATA_TYPES
)


# Create a test client
client = TestClient(app)


class TestGetAllRecipesEndpoint:
    """Test the GET /recipes endpoint"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_all_recipes_success(self, mock_db_client_class):
        """Test successful retrieval of all recipes"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_all_recipes.return_value = [SAMPLE_RECIPE_1]

        # Make request
        response = client.get("/recipes")

        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["status"] == "success"
        assert json_response["count"] == 1
        assert len(json_response["recipes"]) == 1
        assert json_response["recipes"][0]["name"] == "Test Recipe"

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.get_all_recipes.assert_called_once()
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_all_recipes_connection_failure(self, mock_db_client_class):
        """Test handling of database connection failure"""
        # Setup mock to simulate connection failure
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = False

        # Make request
        response = client.get("/recipes")

        # Assertions - the HTTPException is raised directly, not caught by general exception handler
        assert response.status_code == 500
        json_response = response.json()
        assert "Failed to connect to database" in json_response["detail"]

        # Verify disconnect is still called
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_all_recipes_database_error(self, mock_db_client_class):
        """Test handling of database errors during recipe retrieval"""
        # Setup mock to simulate database error
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_all_recipes.side_effect = Exception("Database error")

        # Make request
        response = client.get("/recipes")

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert "Error retrieving recipes" in json_response["detail"]
        assert "Database error" in json_response["detail"]

        # Verify disconnect is still called
        mock_db_client.disconnect.assert_called_once()


class TestCreateRecipeEndpoint:
    """Test the POST /recipes endpoint"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_create_recipe_success(self, mock_db_client_class):
        """Test successful recipe creation"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.add_recipe.return_value = SAMPLE_RECIPE_2

        # Make request
        response = client.post("/recipes", json=CREATE_RECIPE_DATA)

        # Assertions
        assert response.status_code == 201
        json_response = response.json()
        assert json_response["status"] == "success"
        assert json_response["message"] == "Recipe created successfully"
        assert json_response["name"] == SAMPLE_RECIPE_2["name"]
        assert json_response["category"] == SAMPLE_RECIPE_2["category"]
        assert json_response["prep_time"] == SAMPLE_RECIPE_2["prep_time"]
        assert json_response["portions"] == SAMPLE_RECIPE_2["portions"]

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.add_recipe.assert_called_once()
        mock_db_client.disconnect.assert_called_once()

        # Verify the arguments passed to add_recipe
        call_args = mock_db_client.add_recipe.call_args
        assert call_args[1]['name'] == 'New Recipe'
        assert call_args[1]['category'] == 'lunch'
        assert call_args[1]['main_ingredients'] == [{'quantity': 200.0, 'unit': 'g', 'name': 'rice'}]

    @patch('app.routes.recipes.DatabaseClient')
    def test_create_recipe_connection_failure(self, mock_db_client_class):
        """Test handling of database connection failure during recipe creation"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = False

        # Make request
        response = client.post("/recipes", json=CREATE_RECIPE_DATA)

        # Assertions - the HTTPException is raised directly, not caught by general exception handler
        assert response.status_code == 500
        json_response = response.json()
        assert "Failed to connect to database" in json_response["detail"]

    def test_create_recipe_invalid_data(self):
        """Test validation of invalid recipe data"""
        # Make request
        response = client.post("/recipes", json=INVALID_RECIPE_DATA_MISSING_FIELDS)

        # Should return validation error
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response

    def test_create_recipe_invalid_ingredient(self):
        """Test validation of invalid ingredient data"""
        # Make request
        response = client.post("/recipes", json=INVALID_RECIPE_DATA_INVALID_INGREDIENT)

        # Should return validation error
        assert response.status_code == 422
        json_response = response.json()
        assert "detail" in json_response


class TestDeleteRecipeEndpoint:
    """Test the DELETE /recipes/{recipe_id} endpoint"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_delete_recipe_success(self, mock_db_client_class):
        """Test successful recipe deletion"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.delete_recipe.return_value = True

        # Make request
        response = client.delete("/recipes/123")

        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["status"] == "success"
        assert "deleted successfully" in json_response["message"]
        assert "123" in json_response["message"]

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.delete_recipe.assert_called_once_with(123)
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_delete_recipe_not_found(self, mock_db_client_class):
        """Test deletion of non-existent recipe"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.delete_recipe.return_value = False  # Recipe not found

        # Make request
        response = client.delete("/recipes/999")

        # Assertions
        assert response.status_code == 404
        json_response = response.json()
        assert "Recipe with ID 999 not found" in json_response["detail"]

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.delete_recipe.assert_called_once_with(999)
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_delete_recipe_connection_failure(self, mock_db_client_class):
        """Test handling of database connection failure during recipe deletion"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = False

        # Make request
        response = client.delete("/recipes/123")

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert "Failed to connect to database" in json_response["detail"]

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.delete_recipe.assert_not_called()  # Should not be called if connection fails
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_delete_recipe_database_error(self, mock_db_client_class):
        """Test handling of database error during recipe deletion"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.delete_recipe.side_effect = Exception("Database error")

        # Make request
        response = client.delete("/recipes/123")

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert "Error deleting recipe" in json_response["detail"]
        assert "Database error" in json_response["detail"]

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.delete_recipe.assert_called_once_with(123)
        mock_db_client.disconnect.assert_called_once()

    def test_delete_recipe_invalid_id(self):
        """Test deletion with invalid recipe ID"""
        # Make request with invalid ID (non-integer)
        response = client.delete("/recipes/not-a-number")

        # Should return validation error
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response


class TestGetRecipeByIdEndpoint:
    """Test the GET /recipes/{recipe_id} endpoint"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_recipe_by_id_success(self, mock_db_client_class):
        """Test successful retrieval of a recipe by ID"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_recipe_by_id.return_value = SAMPLE_RECIPE_1

        # Make request
        response = client.get("/recipes/1")

        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["id"] == 1
        assert json_response["name"] == "Test Recipe"
        assert json_response["category"] == "dinner"
        assert json_response["main_ingredients"] == [{'quantity': 250, 'unit': 'g', 'name': 'pasta'}]
        assert json_response["common_ingredients"] == ['salt', 'pepper']
        assert json_response["instructions"] == "Cook it"
        assert json_response["prep_time"] == 30
        assert json_response["portions"] == 4
        assert json_response["foto_url"] == "https://example.com/recipe1.jpg"

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.get_recipe_by_id.assert_called_once_with(1)
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_recipe_by_id_not_found(self, mock_db_client_class):
        """Test retrieval of non-existent recipe"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_recipe_by_id.return_value = None

        # Make request
        response = client.get("/recipes/999")

        # Assertions
        assert response.status_code == 404
        json_response = response.json()
        assert json_response["detail"] == "Recipe with ID 999 not found"

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.get_recipe_by_id.assert_called_once_with(999)
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_recipe_by_id_database_connection_error(self, mock_db_client_class):
        """Test recipe retrieval when database connection fails"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = False

        # Make request
        response = client.get("/recipes/1")

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert json_response["detail"] == "Failed to connect to database"

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.get_recipe_by_id.assert_not_called()
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_get_recipe_by_id_database_error(self, mock_db_client_class):
        """Test recipe retrieval when database operation fails"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.get_recipe_by_id.side_effect = Exception("Database error")

        # Make request
        response = client.get("/recipes/1")

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert "Error retrieving recipe" in json_response["detail"]
        assert "Database error" in json_response["detail"]

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.get_recipe_by_id.assert_called_once_with(1)
        mock_db_client.disconnect.assert_called_once()

    def test_get_recipe_by_id_invalid_id(self):
        """Test retrieval with invalid recipe ID"""
        # Make request with invalid ID (non-integer)
        response = client.get("/recipes/not-a-number")

        # Should return validation error
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response


class TestUpdateRecipeEndpoint:
    """Test the PATCH /recipes/{recipe_id} endpoint"""

    @patch('app.routes.recipes.DatabaseClient')
    def test_update_recipe_success(self, mock_db_client_class):
        """Test successful recipe update"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.update_recipe.return_value = UPDATED_RECIPE_RESPONSE

        # Make request
        response = client.patch("/recipes/1", json=UPDATE_RECIPE_DATA)

        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["name"] == "Updated Recipe Name"
        assert json_response["prep_time"] == 35
        assert json_response["instructions"] == "Updated instructions"

        # Verify mock calls
        mock_db_client.connect.assert_called_once()
        mock_db_client.update_recipe.assert_called_once()
        call_args = mock_db_client.update_recipe.call_args
        assert call_args[0][0] == 1  # recipe_id
        assert call_args[0][1]['name'] == 'Updated Recipe Name'
        assert call_args[0][1]['prep_time'] == 35
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_update_recipe_not_found(self, mock_db_client_class):
        """Test update when recipe doesn't exist"""
        # Setup mock to return None (recipe not found)
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.update_recipe.return_value = None

        # Test data
        update_data = {'name': 'Updated Recipe Name'}

        # Make request
        response = client.patch("/recipes/999", json=update_data)

        # Assertions
        assert response.status_code == 404
        json_response = response.json()
        assert "Recipe with ID 999 not found" in json_response["detail"]

        # Verify disconnect is still called
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_update_recipe_connection_failure(self, mock_db_client_class):
        """Test handling of database connection failure"""
        # Setup mock to simulate connection failure
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = False

        # Test data
        update_data = {'name': 'Updated Recipe Name'}

        # Make request
        response = client.patch("/recipes/1", json=update_data)

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert "Failed to connect to database" in json_response["detail"]

        # Verify disconnect is still called
        mock_db_client.disconnect.assert_called_once()

    @patch('app.routes.recipes.DatabaseClient')
    def test_update_recipe_no_fields(self, mock_db_client_class):
        """Test update with no fields provided"""
        # Test data with empty payload
        update_data = {}

        # Make request
        response = client.patch("/recipes/1", json=update_data)

        # Assertions
        assert response.status_code == 400
        json_response = response.json()
        assert "No fields provided for update" in json_response["detail"]

    @patch('app.routes.recipes.DatabaseClient')
    def test_update_recipe_with_ingredients(self, mock_db_client_class):
        """Test update with main_ingredients"""
        # Setup mock
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.update_recipe.return_value = UPDATED_RECIPE_WITH_INGREDIENTS_RESPONSE

        # Make request - FastAPI will automatically convert JSON to RecipeUpdate model
        response = client.patch("/recipes/1", json=UPDATE_RECIPE_WITH_INGREDIENTS_DATA)

        # Assertions
        assert response.status_code == 200
        json_response = response.json()
        assert json_response["main_ingredients"] == [{'quantity': 200, 'unit': 'g', 'name': 'rice'}]
        assert json_response["common_ingredients"] == ['garlic', 'onion']

        # Verify the ingredients were properly converted to dicts in the call to update_recipe
        call_args = mock_db_client.update_recipe.call_args
        assert 'main_ingredients' in call_args[0][1]
        assert isinstance(call_args[0][1]['main_ingredients'], list)
        # The ingredients should be converted to dicts by the endpoint code
        assert isinstance(call_args[0][1]['main_ingredients'][0], dict)
        assert call_args[0][1]['main_ingredients'][0]['name'] == 'rice'

    @patch('app.routes.recipes.DatabaseClient')
    def test_update_recipe_database_error(self, mock_db_client_class):
        """Test handling of database errors during update"""
        # Setup mock to simulate database error
        mock_db_client = Mock()
        mock_db_client_class.return_value = mock_db_client
        mock_db_client.connect.return_value = True
        mock_db_client.update_recipe.side_effect = Exception("Database error")

        # Test data
        update_data = {'name': 'Updated Recipe Name'}

        # Make request
        response = client.patch("/recipes/1", json=update_data)

        # Assertions
        assert response.status_code == 500
        json_response = response.json()
        assert "Error updating recipe" in json_response["detail"]
        assert "Database error" in json_response["detail"]

        # Verify disconnect is still called
        mock_db_client.disconnect.assert_called_once()

    def test_update_recipe_invalid_id(self):
        """Test update with invalid recipe ID"""
        # Test data
        update_data = {'name': 'Updated Recipe Name'}

        # Make request with invalid ID
        response = client.patch("/recipes/not-a-number", json=update_data)

        # Should return validation error
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response

    def test_update_recipe_invalid_data_types(self):
        """Test update with invalid data types"""
        # Make request
        response = client.patch("/recipes/1", json=INVALID_UPDATE_DATA_TYPES)

        # Should return validation error
        assert response.status_code == 422  # Unprocessable Entity
        json_response = response.json()
        assert "detail" in json_response
