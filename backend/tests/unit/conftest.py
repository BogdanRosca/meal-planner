"""
Shared test configuration and fixtures for unit tests
"""
import pytest
import os
from dotenv import load_dotenv
from unittest.mock import Mock

# Load test environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.test'))


# Common test data for recipes
SAMPLE_RECIPE_1 = {
    'id': 1,
    'name': 'Test Recipe',
    'category': 'dinner',
    'main_ingredients': [{'quantity': 250, 'unit': 'g', 'name': 'pasta'}],
    'common_ingredients': ['salt', 'pepper'],
    'instructions': 'Cook it',
    'prep_time': 30,
    'portions': 4,
    'foto_url': 'https://example.com/recipe1.jpg',
    'video_url': None
}

SAMPLE_RECIPE_2 = {
    'id': 123,
    'name': 'New Recipe',
    'category': 'lunch',
    'main_ingredients': [{'quantity': 200, 'unit': 'g', 'name': 'rice'}],
    'common_ingredients': ['salt'],
    'instructions': 'Cook rice',
    'prep_time': 20,
    'portions': 2,
    'foto_url': None,
    'video_url': None
}

# Test data for creating recipes (without ID)
CREATE_RECIPE_DATA = {
    "name": "New Recipe",
    "category": "lunch",
    "main_ingredients": [
        {"quantity": 200, "unit": "g", "name": "rice"}
    ],
    "common_ingredients": ["salt"],
    "instructions": "Cook rice",
    "prep_time": 20,
    "portions": 2,
    "foto_url": None,
    "video_url": None
}

# Test data for updating recipes
UPDATE_RECIPE_DATA = {
    'name': 'Updated Recipe Name',
    'prep_time': 35,
    'instructions': 'Updated instructions'
}

UPDATE_RECIPE_WITH_INGREDIENTS_DATA = {
    'main_ingredients': [
        {'quantity': 200, 'unit': 'g', 'name': 'rice'}
    ],
    'common_ingredients': ['garlic', 'onion']
}

# Updated recipe response after successful update
UPDATED_RECIPE_RESPONSE = {
    'id': 1,
    'name': 'Updated Recipe Name',
    'category': 'dinner',
    'main_ingredients': [{'quantity': 250, 'unit': 'g', 'name': 'pasta'}],
    'common_ingredients': ['salt', 'pepper'],
    'instructions': 'Updated instructions',
    'prep_time': 35,
    'portions': 4,
    'foto_url': 'https://example.com/recipe1.jpg',
    'video_url': None
}

# Updated recipe response after ingredient update
UPDATED_RECIPE_WITH_INGREDIENTS_RESPONSE = {
    'id': 1,
    'name': 'Test Recipe',
    'category': 'dinner',
    'main_ingredients': [{'quantity': 200, 'unit': 'g', 'name': 'rice'}],
    'common_ingredients': ['garlic', 'onion'],
    'instructions': 'Cook rice',
    'prep_time': 25,
    'portions': 2,
    'foto_url': 'https://example.com/recipe1.jpg',
    'video_url': None
}

# Invalid test data
INVALID_RECIPE_DATA_MISSING_FIELDS = {
    "name": "Incomplete Recipe",
    # missing category, main_ingredients, etc.
}

INVALID_RECIPE_DATA_INVALID_INGREDIENT = {
    "name": "Recipe with Invalid Ingredient",
    "category": "dinner",
    "main_ingredients": [
        {"quantity": "not-a-number", "unit": "g", "name": "pasta"}  # invalid quantity
    ],
    "common_ingredients": ["salt"],
    "instructions": "Cook it",
    "prep_time": 30,
    "portions": 4
}

INVALID_UPDATE_DATA_TYPES = {
    'prep_time': 'not-a-number',  # Should be int
    'portions': 'also-not-a-number'  # Should be int
}

# Database row tuples (as returned by cursor.fetchone/fetchall)
SAMPLE_RECIPE_1_DB_ROW = (
    1, 'Test Recipe', 'dinner',
    [{'quantity': 250, 'unit': 'g', 'name': 'pasta'}],
    ['salt', 'pepper'],
    'Cook it', 30, 4, 'https://example.com/recipe1.jpg', None
)

SAMPLE_RECIPE_2_DB_ROW = (
    123, 'New Recipe', 'lunch',
    [{'quantity': 200, 'unit': 'g', 'name': 'rice'}],
    ['salt'],
    'Cook rice', 20, 2, None, None
)

# Database test data for add_recipe method
ADD_RECIPE_PARAMS = {
    'name': 'New Recipe',
    'category': 'lunch',
    'main_ingredients': [{'quantity': 200, 'unit': 'g', 'name': 'rice'}],
    'common_ingredients': ['salt'],
    'instructions': 'Cook rice',
    'prep_time': 20,
    'portions': 2,
    'foto_url': None,
    'video_url': None
}

# Update recipe test data
UPDATE_RECIPE_PARAMS = {'name': 'Updated Recipe'}
UPDATE_RECIPE_WITH_INGREDIENTS_PARAMS = {
    'main_ingredients': [{'quantity': 200, 'unit': 'g', 'name': 'rice'}],
    'common_ingredients': ['garlic', 'onion']
}

# Updated recipe database row
UPDATED_RECIPE_DB_ROW = (
    1, 'Test Recipe', 'dinner',
    [{'quantity': 200, 'unit': 'g', 'name': 'rice'}],
    ['garlic', 'onion'],
    'Cook rice', 25, 2, 'https://example.com/recipe1.jpg', None
)

# Edge case test data
EDGE_CASE_RECIPE_DATA = {
    "name": "A" * 255,  # Very long name
    "category": "breakfast",
    "main_ingredients": [
        {"quantity": 0.001, "unit": "mg", "name": "x"},  # Very small quantity
        {"quantity": 9999.999, "unit": "kg", "name": "y"}  # Very large quantity
    ],
    "common_ingredients": [],  # Empty list
    "instructions": "X",  # Minimal instructions
    "prep_time": 0,  # Zero prep time
    "portions": 1,  # Minimum portions
    "foto_url": None,
    "video_url": None
}

UNICODE_RECIPE_DATA = {
    "name": "Crème Brûlée with émmental 🧀",
    "category": "dinner",
    "main_ingredients": [
        {"quantity": 250, "unit": "g", "name": "émmental cheese"},
        {"quantity": 2, "unit": "cups", "name": "crème fraîche"}
    ],
    "common_ingredients": ["salt", "poivre noir", "herbes de Provence"],
    "instructions": "Mélanger délicatement les ingrédients...",
    "prep_time": 45,
    "portions": 6,
    "foto_url": "https://example.com/crème-brûlée.jpg",
    "video_url": None
}


# Recipe with many ingredients
def generate_many_ingredients_recipe_data():
    """Generate recipe data with many ingredients for testing"""
    main_ingredients = [
        {"quantity": i, "unit": "g", "name": f"ingredient_{i}"}
        for i in range(1, 21)  # 20 ingredients
    ]

    common_ingredients = [f"common_{i}" for i in range(1, 11)]  # 10 common ingredients

    return {
        "name": "Complex Recipe",
        "category": "dinner",
        "main_ingredients": main_ingredients,
        "common_ingredients": common_ingredients,
        "instructions": "Mix everything together",
        "prep_time": 120,
        "portions": 8
    }


# Complex recipe with many ingredients
COMPLEX_RECIPE_DATA = {
    "name": "Complex Recipe",
    "category": "dinner",
    "main_ingredients": [
        {"quantity": i, "unit": "g", "name": f"ingredient_{i}"}
        for i in range(1, 21)  # 20 ingredients
    ],
    "common_ingredients": [f"common_{i}" for i in range(1, 11)],  # 10 common ingredients
    "instructions": "Mix everything together",
    "prep_time": 120,
    "portions": 8,
    "foto_url": None,
    "video_url": None
}

# Empty recipe data for edge case testing
EMPTY_RECIPE_DATA = {
    "name": "Empty Recipe",
    "category": "snack",
    "main_ingredients": [],
    "common_ingredients": [],
    "instructions": "No cooking",
    "prep_time": 0,
    "portions": 1,
    "foto_url": None,
    "video_url": None
}

# Database row for empty recipe
EMPTY_RECIPE_DB_ROW = (
    1, 'Empty Recipe', 'snack', [], [], 'No cooking', 0, 1, None, None
)


@pytest.fixture
def mock_db_client():
    """Create a mock database client for testing"""
    mock_client = Mock()
    mock_client.connect.return_value = True
    mock_client.disconnect.return_value = None
    return mock_client


@pytest.fixture
def mock_db_client_connection_failure():
    """Create a mock database client that fails to connect"""
    mock_client = Mock()
    mock_client.connect.return_value = False
    mock_client.disconnect.return_value = None
    return mock_client


@pytest.fixture
def mock_db_client_with_database_error():
    """Create a mock database client that raises database errors"""
    mock_client = Mock()
    mock_client.connect.return_value = True
    mock_client.disconnect.return_value = None
    return mock_client
