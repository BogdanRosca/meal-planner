"""
Shared fixtures for integration tests: a dedicated user that every test runs as
"""
import os

import pytest
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.test'))

from app.auth import AuthUser, get_current_user  # noqa: E402
from app.database_client import DatabaseClient  # noqa: E402
from app.main import app  # noqa: E402

INTEGRATION_USER_EMAIL = 'integration-tester@example.com'
OTHER_USER_EMAIL = 'integration-other@example.com'


def _create_fresh_user(email):
    db = DatabaseClient()
    assert db.connect(), "Integration tests need a running database"
    try:
        # Leftovers from an aborted run would carry stale recipes
        cursor = db._connection.cursor()
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        db._connection.commit()
        cursor.close()
        return db.create_user(email, None)
    finally:
        db.disconnect()


def _delete_user(user_id):
    db = DatabaseClient()
    if not db.connect():
        return
    try:
        # Cascades to the user's recipes and meal plans
        cursor = db._connection.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        db._connection.commit()
        cursor.close()
    finally:
        db.disconnect()


@pytest.fixture(scope='session')
def test_user():
    user = _create_fresh_user(INTEGRATION_USER_EMAIL)
    yield user
    _delete_user(user['id'])


@pytest.fixture(scope='session')
def other_user():
    user = _create_fresh_user(OTHER_USER_EMAIL)
    yield user
    _delete_user(user['id'])


@pytest.fixture
def user_id(test_user):
    return test_user['id']


@pytest.fixture(autouse=True)
def authenticated_as_test_user(test_user):
    """API calls in integration tests run as the integration user"""
    app.dependency_overrides[get_current_user] = lambda: AuthUser(**test_user)
    yield
    app.dependency_overrides.pop(get_current_user, None)
