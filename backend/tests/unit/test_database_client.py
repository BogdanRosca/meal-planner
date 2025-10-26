"""
Unit tests for DatabaseClient methods using mocks
"""
import pytest
from unittest.mock import Mock, patch
import psycopg2
from app.database_client import DatabaseClient
from .conftest import (
    SAMPLE_RECIPE_1, SAMPLE_RECIPE_2, SAMPLE_RECIPE_1_DB_ROW, SAMPLE_RECIPE_2_DB_ROW,
    ADD_RECIPE_PARAMS, UPDATE_RECIPE_PARAMS, UPDATE_RECIPE_WITH_INGREDIENTS_PARAMS,
    UPDATED_RECIPE_DB_ROW
)


class TestDatabaseClientConnection:
    """Test DatabaseClient connection methods"""
    
    @patch('app.database_client.psycopg2.connect')
    def test_connect_success(self, mock_connect):
        """Test successful database connection"""
        # Setup mock
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        # Create client and connect
        client = DatabaseClient()
        result = client.connect()
        
        # Assertions
        assert result is True
        assert client._connection == mock_connection
        mock_connect.assert_called_once()
    
    @patch('app.database_client.psycopg2.connect')
    def test_connect_failure(self, mock_connect):
        """Test database connection failure"""
        # Setup mock to raise exception
        mock_connect.side_effect = psycopg2.Error("Connection failed")
        
        # Create client and attempt connection
        client = DatabaseClient()
        result = client.connect()
        
        # Assertions
        assert result is False
        assert client._connection is None
    
    def test_disconnect(self):
        """Test database disconnection"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection
        
        # Disconnect
        client.disconnect()
        
        # Assertions
        mock_connection.close.assert_called_once()
        assert client._connection is None
    
    def test_disconnect_no_connection(self):
        """Test disconnection when no connection exists"""
        client = DatabaseClient()
        client._connection = None
        
        # Should not raise an error
        client.disconnect()
        assert client._connection is None
    
    def test_is_connected_true(self):
        """Test is_connected when connection is active"""
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection
        
        result = client.is_connected()
        
        assert result is True
        mock_connection.cursor.assert_called_once()
        mock_cursor.execute.assert_called_once_with("SELECT 1")
        mock_cursor.close.assert_called_once()
    
    def test_is_connected_false_no_connection(self):
        """Test is_connected when no connection exists"""
        client = DatabaseClient()
        client._connection = None
        
        result = client.is_connected()
        
        assert result is False
    
    @patch('app.database_client.psycopg2.Error', psycopg2.Error)
    def test_is_connected_false_error(self):
        """Test is_connected when connection has error"""
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_cursor.execute.side_effect = psycopg2.Error("Connection lost")
        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection
        
        result = client.is_connected()
        
        assert result is False


class TestDatabaseClientGetAllRecipes:
    """Test DatabaseClient get_all_recipes method"""
    
    def test_get_all_recipes_success(self):
        """Test successful retrieval of all recipes"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        
        # Mock database response
        mock_cursor.fetchall.return_value = [SAMPLE_RECIPE_1_DB_ROW]
        
        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            recipes = client.get_all_recipes()
        
        # Assertions
        assert len(recipes) == 1
        recipe = recipes[0]
        assert recipe['id'] == SAMPLE_RECIPE_1['id']
        assert recipe['name'] == SAMPLE_RECIPE_1['name']
        assert recipe['category'] == SAMPLE_RECIPE_1['category']
        assert recipe['main_ingredients'] == SAMPLE_RECIPE_1['main_ingredients']
        assert recipe['common_ingredients'] == SAMPLE_RECIPE_1['common_ingredients']
        assert recipe['instructions'] == SAMPLE_RECIPE_1['instructions']
        assert recipe['prep_time'] == SAMPLE_RECIPE_1['prep_time']
        assert recipe['portions'] == SAMPLE_RECIPE_1['portions']
        assert recipe['portions'] == SAMPLE_RECIPE_1['portions']
        
        # Verify SQL query
        mock_cursor.execute.assert_called_once()
        sql_call = mock_cursor.execute.call_args[0][0]
        assert "SELECT id, name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url" in sql_call
        assert "FROM recipes" in sql_call
        
        mock_cursor.close.assert_called_once()
    
    def test_get_all_recipes_not_connected(self):
        """Test get_all_recipes when not connected to database"""
        client = DatabaseClient()
        client._connection = None
        
        # Mock is_connected to return False
        with patch.object(client, 'is_connected', return_value=False):
            with pytest.raises(Exception) as exc_info:
                client.get_all_recipes()
        
        assert "Not connected to database" in str(exc_info.value)


class TestDatabaseClientGetRecipeById:
    """Test DatabaseClient get_recipe_by_id method"""
    
    def test_get_recipe_by_id_success(self):
        """Test successful retrieval of recipe by ID"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        
        # Mock database response
        mock_cursor.fetchone.return_value = SAMPLE_RECIPE_1_DB_ROW
        
        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            recipe = client.get_recipe_by_id(1)
        
        # Assertions
        assert recipe['id'] == SAMPLE_RECIPE_1['id']
        assert recipe['name'] == SAMPLE_RECIPE_1['name']
        assert recipe['category'] == SAMPLE_RECIPE_1['category']
        assert recipe['main_ingredients'] == SAMPLE_RECIPE_1['main_ingredients']
        assert recipe['common_ingredients'] == SAMPLE_RECIPE_1['common_ingredients']
        assert recipe['instructions'] == SAMPLE_RECIPE_1['instructions']
        assert recipe['prep_time'] == SAMPLE_RECIPE_1['prep_time']
        assert recipe['portions'] == SAMPLE_RECIPE_1['portions']
        
        # Verify SQL query
        mock_cursor.execute.assert_called_once()
        call_args = mock_cursor.execute.call_args
        assert "SELECT id, name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url" in call_args[0][0]
        assert "FROM recipes" in call_args[0][0]
        assert "WHERE id = %s" in call_args[0][0]
        assert call_args[0][1] == (1,)
        
        mock_cursor.close.assert_called_once()
    
    def test_get_recipe_by_id_not_found(self):
        """Test get_recipe_by_id when recipe doesn't exist"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        
        # Mock database response - no recipe found
        mock_cursor.fetchone.return_value = None
        
        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            recipe = client.get_recipe_by_id(999)
        
        # Assertions
        assert recipe is None
        
        # Verify SQL query
        mock_cursor.execute.assert_called_once_with(
            """
            SELECT id, name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url
            FROM recipes
            WHERE id = %s
        """, (999,)
        )
        
        mock_cursor.close.assert_called_once()
    
    def test_get_recipe_by_id_not_connected(self):
        """Test get_recipe_by_id when not connected to database"""
        client = DatabaseClient()
        client._connection = None
        
        # Mock is_connected to return False
        with patch.object(client, 'is_connected', return_value=False):
            with pytest.raises(Exception) as exc_info:
                client.get_recipe_by_id(1)
        
        assert "Not connected to database" in str(exc_info.value)


class TestDatabaseClientAddRecipe:
    """Test DatabaseClient add_recipe method"""
    
    def test_add_recipe_success(self):
        """Test successful recipe addition"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        
        # Mock database response for RETURNING clause
        mock_cursor.fetchone.return_value = SAMPLE_RECIPE_2_DB_ROW
        
        mock_connection.cursor.return_value = mock_cursor
        client._connection = mock_connection
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            result = client.add_recipe(**ADD_RECIPE_PARAMS)
        
        # Assertions
        assert result['id'] == SAMPLE_RECIPE_2['id']
        assert result['name'] == SAMPLE_RECIPE_2['name']
        assert result['category'] == SAMPLE_RECIPE_2['category']
        assert result['main_ingredients'] == SAMPLE_RECIPE_2['main_ingredients']
        assert result['common_ingredients'] == SAMPLE_RECIPE_2['common_ingredients']
        
        # Verify SQL execution
        mock_cursor.execute.assert_called_once()
        sql_call = mock_cursor.execute.call_args[0][0]
        assert "INSERT INTO recipes" in sql_call
        assert "RETURNING" in sql_call
        
        # Verify parameters were passed correctly
        params = mock_cursor.execute.call_args[0][1]
        assert params[0] == ADD_RECIPE_PARAMS['name']
        assert params[1] == ADD_RECIPE_PARAMS['category']
        # params[2] should be JSON string of main_ingredients
        assert 'rice' in params[2]  # JSON contains rice
        assert params[3] == ADD_RECIPE_PARAMS['common_ingredients']
        
        mock_connection.commit.assert_called_once()
        mock_cursor.close.assert_called_once()
    
    def test_add_recipe_not_connected(self):
        """Test add_recipe when not connected to database"""
        client = DatabaseClient()
        client._connection = None
        
        # Mock is_connected to return False
        with patch.object(client, 'is_connected', return_value=False):
            with pytest.raises(Exception) as exc_info:
                client.add_recipe(
                    name='Test',
                    category='lunch',
                    main_ingredients=[],
                    common_ingredients=[],
                    instructions='Test',
                    prep_time=10,
                    portions=1,
                    foto_url="www.my-foto-url.net"
                )
        
        assert "Not connected to database" in str(exc_info.value)


class TestDatabaseClientDeleteRecipe:
    """Test DatabaseClient delete_recipe method"""
    
    def test_delete_recipe_success(self):
        """Test successful recipe deletion"""
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection
        
        # Mock cursor and its methods
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            # Mock that recipe exists (fetchone returns a row)
            mock_cursor.fetchone.return_value = (123,)  # Recipe exists
            mock_cursor.rowcount = 1  # One row was deleted
            
            # Call delete_recipe
            result = client.delete_recipe(123)
        
        # Assertions
        assert result is True
        
        # Verify SQL execution
        assert mock_cursor.execute.call_count == 2  # One SELECT, one DELETE
        
        # Check first call (SELECT to verify existence)
        first_call = mock_cursor.execute.call_args_list[0]
        assert "SELECT id FROM recipes WHERE id = %s" in first_call[0][0]
        assert first_call[0][1] == (123,)
        
        # Check second call (DELETE)
        second_call = mock_cursor.execute.call_args_list[1]
        assert "DELETE FROM recipes WHERE id = %s" in second_call[0][0]
        assert second_call[0][1] == (123,)
        
        mock_connection.commit.assert_called_once()
        mock_cursor.close.assert_called_once()
    
    def test_delete_recipe_not_found(self):
        """Test deleting a non-existent recipe"""
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection
        
        # Mock cursor and its methods
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            # Mock that recipe doesn't exist (fetchone returns None)
            mock_cursor.fetchone.return_value = None
            
            # Call delete_recipe
            result = client.delete_recipe(999)
        
        # Assertions
        assert result is False
        
        # Verify only SELECT was executed (not DELETE)
        assert mock_cursor.execute.call_count == 1
        select_call = mock_cursor.execute.call_args_list[0]
        assert "SELECT id FROM recipes WHERE id = %s" in select_call[0][0]
        assert select_call[0][1] == (999,)
        
        # Commit should not be called since no deletion occurred
        mock_connection.commit.assert_not_called()
        mock_cursor.close.assert_called_once()
    
    def test_delete_recipe_not_connected(self):
        """Test delete_recipe when not connected to database"""
        client = DatabaseClient()
        client._connection = None
        
        # Mock is_connected to return False
        with patch.object(client, 'is_connected', return_value=False):
            with pytest.raises(Exception) as exc_info:
                client.delete_recipe(123)
        
        assert "Not connected to database" in str(exc_info.value)
    
    def test_delete_recipe_no_rows_affected(self):
        """Test delete_recipe when no rows are affected despite recipe existing"""
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection
        
        # Mock cursor and its methods
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock is_connected to return True
        with patch.object(client, 'is_connected', return_value=True):
            # Mock that recipe exists but deletion affects 0 rows (edge case)
            mock_cursor.fetchone.return_value = (123,)  # Recipe exists
            mock_cursor.rowcount = 0  # No rows were deleted (edge case)
            
            # Call delete_recipe
            result = client.delete_recipe(123)
        
        # Assertions
        assert result is False


class TestDatabaseClientInitialization:
    """Test DatabaseClient initialization"""
    
    @patch.dict('os.environ', {
        'PGHOST': 'test_host',
        'PGPORT': '5432',
        'PGDATABASE': 'test_db',
        'POSTGRES_USER': 'test_user',
        'POSTGRES_PASSWORD': 'test_pass'
    })
    def test_init_with_env_variables(self):
        """Test initialization with environment variables"""
        client = DatabaseClient()
        
        assert client.host == 'test_host'
        assert client.port == '5432'
        assert client.database == 'test_db'
        assert client.user == 'test_user'
        assert client.password == 'test_pass'
        assert client._connection is None
    
    def test_init_with_parameters(self):
        """Test initialization with explicit parameters"""
        client = DatabaseClient(
            host='param_host',
            port='1234',
            database='param_db',
            user='param_user',
            password='param_pass'
        )
        
        assert client.host == 'param_host'
        assert client.port == '1234'
        assert client.database == 'param_db'
        assert client.user == 'param_user'
        assert client.password == 'param_pass'


class TestUpdateRecipeMethod:
    """Test the update_recipe method"""
    
    def test_update_recipe_success(self):
        """Test successful recipe update"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        client._connection = mock_connection
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock fetchone to simulate recipe exists check
        mock_cursor.fetchone.side_effect = [
            (1,),  # Recipe exists check
            (1, 'Updated Recipe', 'dinner', 
             [{'quantity': 300, 'unit': 'g', 'name': 'pasta'}],
             ['salt', 'pepper'],
             'Updated instructions',
             35, 4, 'https://example.com/recipe1.jpg')  # Updated recipe data with foto_url
        ]
        
        # Call method
        result = client.update_recipe(1, UPDATE_RECIPE_PARAMS)
        
        # Assertions
        assert result is not None
        assert result['id'] == 1
        assert result['name'] == 'Updated Recipe'
        
        # Verify cursor calls (is_connected check, exists check, update, select)
        assert mock_cursor.execute.call_count == 4
        mock_connection.commit.assert_called_once()
        # cursor.close() is called once at the end
        mock_cursor.close.assert_called()
    
    def test_update_recipe_not_found(self):
        """Test update when recipe doesn't exist"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        client._connection = mock_connection
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock fetchone to simulate recipe doesn't exist
        mock_cursor.fetchone.return_value = None
        
        # Test data
        updates = {'name': 'Updated Recipe'}
        
        # Call method
        result = client.update_recipe(999, updates)
        
        # Assertions
        assert result is None
        # cursor.close() is called in the early return
        mock_cursor.close.assert_called()
        mock_connection.commit.assert_not_called()
    
    def test_update_recipe_no_connection(self):
        """Test update when not connected to database"""
        # Setup client without connection
        client = DatabaseClient()
        client._connection = None
        
        # Test data
        updates = {'name': 'Updated Recipe'}
        
        # Call method and expect exception
        with pytest.raises(Exception, match="Not connected to database"):
            client.update_recipe(1, updates)
    
    def test_update_recipe_empty_updates(self):
        """Test update with no valid fields to update"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        client._connection = mock_connection
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock fetchone to simulate recipe exists
        mock_cursor.fetchone.return_value = (1,)
        
        # Test data with no valid update fields
        updates = {'invalid_field': 'value'}
        
        # Call method
        result = client.update_recipe(1, updates)
        
        # Assertions
        assert result is None
        # cursor.close() is called when no valid fields found
        mock_cursor.close.assert_called()
        mock_connection.commit.assert_not_called()
    
    def test_update_recipe_with_ingredients(self):
        """Test updating recipe with main_ingredients and common_ingredients"""
        # Setup client with mock connection
        client = DatabaseClient()
        mock_connection = Mock()
        mock_cursor = Mock()
        client._connection = mock_connection
        mock_connection.cursor.return_value = mock_cursor
        
        # Mock fetchone to simulate recipe exists check and return updated data
        mock_cursor.fetchone.side_effect = [
            (1,),  # Recipe exists check
            UPDATED_RECIPE_DB_ROW  # Updated recipe data
        ]
        
        # Call method
        result = client.update_recipe(1, UPDATE_RECIPE_WITH_INGREDIENTS_PARAMS)
        
        # Assertions
        assert result is not None
        assert result['main_ingredients'] == UPDATE_RECIPE_WITH_INGREDIENTS_PARAMS['main_ingredients']
        assert result['common_ingredients'] == UPDATE_RECIPE_WITH_INGREDIENTS_PARAMS['common_ingredients']
        
        # Verify JSON serialization was called for ingredients
        mock_cursor.execute.assert_called()
        mock_connection.commit.assert_called_once()
        mock_cursor.close.assert_called()
        mock_connection.commit.assert_called_once()
        mock_cursor.close.assert_called()
