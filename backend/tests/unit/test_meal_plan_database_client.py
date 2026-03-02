"""
Unit tests for DatabaseClient meal plan methods using mocks
"""
import pytest
from unittest.mock import Mock
from app.database_client import DatabaseClient


SAMPLE_MEAL_PLAN_ENTRY = {
    'id': 1,
    'week_start': '2026-03-02',
    'day_of_week': 0,
    'meal_slot': 'breakfast',
    'recipe_id': 10,
    'recipe_name': 'Pancakes',
    'recipe_category': 'breakfast',
    'recipe_foto_url': None,
}

SAMPLE_MEAL_PLAN_DB_ROW = (
    1, '2026-03-02', 0, 'breakfast', 10, 'Pancakes', 'breakfast', None
)

SAMPLE_MEAL_PLAN_DB_ROW_2 = (
    2, '2026-03-02', 0, 'lunch', 11, 'Caesar Salad', 'lunch', 'https://example.com/salad.jpg'
)


class TestGetMealPlanByWeek:
    """Test get_meal_plan_by_week method"""

    def test_get_meal_plan_by_week_success(self):
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection

        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [SAMPLE_MEAL_PLAN_DB_ROW, SAMPLE_MEAL_PLAN_DB_ROW_2]

        # is_connected check
        mock_cursor.execute.return_value = None
        mock_cursor.fetchone.return_value = (1,)

        entries = client.get_meal_plan_by_week('2026-03-02')

        assert len(entries) == 2
        assert entries[0]['recipe_name'] == 'Pancakes'
        assert entries[1]['recipe_name'] == 'Caesar Salad'
        assert entries[1]['recipe_foto_url'] == 'https://example.com/salad.jpg'

    def test_get_meal_plan_by_week_empty(self):
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection

        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []
        mock_cursor.fetchone.return_value = (1,)

        entries = client.get_meal_plan_by_week('2026-03-02')
        assert entries == []

    def test_get_meal_plan_by_week_not_connected(self):
        client = DatabaseClient()
        client._connection = None

        with pytest.raises(Exception, match="Not connected to database"):
            client.get_meal_plan_by_week('2026-03-02')


class TestAddMealPlanEntry:
    """Test add_meal_plan_entry method"""

    def test_add_meal_plan_entry_success(self):
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection

        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        # Calls: INSERT RETURNING id, then SELECT joined row
        # (is_connected only calls execute + close, no fetchone)
        mock_cursor.fetchone.side_effect = [
            (1,),                      # INSERT RETURNING id
            SAMPLE_MEAL_PLAN_DB_ROW,   # SELECT joined row
        ]

        result = client.add_meal_plan_entry('2026-03-02', 0, 'breakfast', 10)

        assert result['id'] == 1
        assert result['recipe_name'] == 'Pancakes'
        assert result['meal_slot'] == 'breakfast'
        mock_connection.commit.assert_called_once()

    def test_add_meal_plan_entry_not_connected(self):
        client = DatabaseClient()
        client._connection = None

        with pytest.raises(Exception, match="Not connected to database"):
            client.add_meal_plan_entry('2026-03-02', 0, 'breakfast', 10)


class TestDeleteMealPlanEntry:
    """Test delete_meal_plan_entry method"""

    def test_delete_meal_plan_entry_success(self):
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection

        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_cursor.rowcount = 1
        mock_cursor.fetchone.return_value = (1,)

        result = client.delete_meal_plan_entry(1)

        assert result is True
        mock_connection.commit.assert_called_once()

    def test_delete_meal_plan_entry_not_found(self):
        client = DatabaseClient()
        mock_connection = Mock()
        client._connection = mock_connection

        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_cursor.rowcount = 0
        mock_cursor.fetchone.return_value = (1,)

        result = client.delete_meal_plan_entry(999)

        assert result is False

    def test_delete_meal_plan_entry_not_connected(self):
        client = DatabaseClient()
        client._connection = None

        with pytest.raises(Exception, match="Not connected to database"):
            client.delete_meal_plan_entry(1)
