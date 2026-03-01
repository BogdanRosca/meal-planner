"""
Unit tests for meal plan API endpoints using mocks
"""
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)

SAMPLE_ENTRY = {
    'id': 1,
    'week_start': '2026-03-02',
    'day_of_week': 0,
    'meal_slot': 'breakfast',
    'recipe_id': 10,
    'recipe_name': 'Pancakes',
    'recipe_category': 'breakfast',
    'recipe_foto_url': None,
}


class TestGetMealPlanEndpoint:
    """Test GET /meal-plans endpoint"""

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_get_meal_plan_success(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.get_meal_plan_by_week.return_value = [SAMPLE_ENTRY]

        response = client.get("/meal-plans?week_start=2026-03-02")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert len(data["entries"]) == 1
        assert data["entries"][0]["recipe_name"] == "Pancakes"

        mock_db.connect.assert_called_once()
        mock_db.disconnect.assert_called_once()

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_get_meal_plan_empty(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.get_meal_plan_by_week.return_value = []

        response = client.get("/meal-plans?week_start=2026-03-02")

        assert response.status_code == 200
        assert response.json()["entries"] == []

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_get_meal_plan_connection_failure(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = False

        response = client.get("/meal-plans?week_start=2026-03-02")

        assert response.status_code == 500

    def test_get_meal_plan_missing_week_start(self):
        response = client.get("/meal-plans")
        assert response.status_code == 422

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_get_meal_plan_database_error(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.get_meal_plan_by_week.side_effect = Exception("DB error")

        response = client.get("/meal-plans?week_start=2026-03-02")

        assert response.status_code == 500
        mock_db.disconnect.assert_called_once()


class TestCreateMealPlanEntryEndpoint:
    """Test POST /meal-plans endpoint"""

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_create_entry_success(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.add_meal_plan_entry.return_value = SAMPLE_ENTRY

        response = client.post("/meal-plans", json={
            "week_start": "2026-03-02",
            "day_of_week": 0,
            "meal_slot": "breakfast",
            "recipe_id": 10,
        })

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert data["entry"]["recipe_name"] == "Pancakes"

        mock_db.add_meal_plan_entry.assert_called_once_with(
            week_start="2026-03-02",
            day_of_week=0,
            meal_slot="breakfast",
            recipe_id=10,
        )
        mock_db.disconnect.assert_called_once()

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_create_entry_connection_failure(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = False

        response = client.post("/meal-plans", json={
            "week_start": "2026-03-02",
            "day_of_week": 0,
            "meal_slot": "breakfast",
            "recipe_id": 10,
        })

        assert response.status_code == 500

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_create_entry_database_error(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.add_meal_plan_entry.side_effect = Exception("DB error")

        response = client.post("/meal-plans", json={
            "week_start": "2026-03-02",
            "day_of_week": 0,
            "meal_slot": "breakfast",
            "recipe_id": 10,
        })

        assert response.status_code == 500
        mock_db.disconnect.assert_called_once()

    def test_create_entry_missing_fields(self):
        response = client.post("/meal-plans", json={
            "week_start": "2026-03-02",
        })
        assert response.status_code == 422


class TestDeleteMealPlanEntryEndpoint:
    """Test DELETE /meal-plans/{id} endpoint"""

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_delete_entry_success(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.delete_meal_plan_entry.return_value = True

        response = client.delete("/meal-plans/1")

        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_db.disconnect.assert_called_once()

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_delete_entry_not_found(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.delete_meal_plan_entry.return_value = False

        response = client.delete("/meal-plans/999")

        assert response.status_code == 404

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_delete_entry_connection_failure(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = False

        response = client.delete("/meal-plans/1")

        assert response.status_code == 500

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_delete_entry_database_error(self, mock_db_class):
        mock_db = Mock()
        mock_db_class.return_value = mock_db
        mock_db.connect.return_value = True
        mock_db.delete_meal_plan_entry.side_effect = Exception("DB error")

        response = client.delete("/meal-plans/1")

        assert response.status_code == 500
        mock_db.disconnect.assert_called_once()
