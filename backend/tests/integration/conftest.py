"""
Shared fixtures for integration tests: a dedicated user that every test runs as
"""
import os

import httpx
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.test'))

from app.auth import AuthUser, get_current_user  # noqa: E402
from app.database_client import DatabaseClient  # noqa: E402
from app.main import app  # noqa: E402

INTEGRATION_USER_EMAIL = 'integration-tester@example.com'
OTHER_USER_EMAIL = 'integration-other@example.com'

# Opt-in: results are only reported when this is set
QUALITY_HUB_URL = os.getenv('QUALITY_HUB_URL')
QUALITY_HUB_TIMEOUT_SECONDS = 5

_reports_key = pytest.StashKey[dict]()


def _test_result(item, reports):
    """Collapse the setup/call/teardown reports into one status + duration"""
    failed = next((r for r in reports.values() if r.failed), None)
    # Without a call report, setup failed or skipped and the body never ran
    report = failed or reports.get('call') or reports['setup']
    return {
        'name': item.nodeid,
        'status': report.outcome,
        'duration': round(sum(r.duration for r in reports.values()), 3),
    }


def _send_result(result):
    try:
        response = httpx.post(
            f"{QUALITY_HUB_URL.rstrip('/')}/results",
            json=result,
            timeout=QUALITY_HUB_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPError as e:
        # Reporting must never break the test run
        print(f"\n[quality-hub] failed to report {result['name']}: {e}")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item):
    """Send each integration test's outcome to the quality hub once it finishes.

    A hook rather than an autouse fixture: when a session fixture (e.g. the
    DB user) fails, function fixtures never set up, so a fixture would miss
    exactly the errored tests.
    """
    outcome = yield
    if not QUALITY_HUB_URL:
        return
    report = outcome.get_result()
    item.stash.setdefault(_reports_key, {})[report.when] = report
    if report.when == 'teardown':
        _send_result(_test_result(item, item.stash[_reports_key]))


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


@pytest.fixture
def client():
    """Fresh API client per test, so cookies never leak between tests"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def authenticated_as_test_user(test_user):
    """API calls in integration tests run as the integration user"""
    app.dependency_overrides[get_current_user] = lambda: AuthUser(**test_user)
    yield
    app.dependency_overrides.pop(get_current_user, None)
