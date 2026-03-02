"""
Shared test configuration and fixtures for database client tests
"""
import pytest
import os
from dotenv import load_dotenv
from app.database_client import DatabaseClient

# Load test environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env.test'))


@pytest.fixture
def db_client():
    """Create a database client for testing"""
    client = DatabaseClient()
    yield client
    client.disconnect()


# Shared test data
TEST_RECIPE_DATA = {"name": "Test Soup",
                    "category": "lunch",
                    "main_ingredients": [{"name": "chicken",
                                          "unit": "pcs",
                                          "quantity": 1},
                                         {"name": "tomato",
                                          "unit": "g",
                                          "quantity": 300},
                                         {"name": "onion",
                                          "unit": "pcs",
                                          "quantity": 2},
                                         {"name": "potato",
                                          "unit": "pcs",
                                          "quantity": 3}],
                    "common_ingredients": ["salt",
                                           "pepper",
                                           "basil",
                                           "olive oil",
                                           "garlic"],
                    "instructions": "Sauté onion, garlic; add carrots, celery, potatoes, broth. Simmer gently. Stir in herbs, salt, pepper. Serve warm.",
                    "prep_time": 35,
                    "portions": 2}
