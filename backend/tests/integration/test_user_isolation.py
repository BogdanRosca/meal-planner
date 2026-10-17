"""
Integration tests for per-user ownership: users only see and change their own recipes and meal plans
"""
import pytest
from fastapi.testclient import TestClient

from app.auth import SESSION_COOKIE, get_current_user, hash_password
from app.database_client import DatabaseClient
from app.main import app

client = TestClient(app)

RECIPE = dict(
    name="Someone else's stew",
    category="dinner",
    main_ingredients=[{"quantity": 1, "unit": "pcs", "name": "carrot"}],
    common_ingredients=["salt"],
    instructions="Simmer",
    prep_time=40,
    portions=2,
    foto_url=None,
    video_url=None,
)


@pytest.fixture
def db():
    db_client = DatabaseClient()
    assert db_client.connect()
    yield db_client
    db_client.disconnect()


@pytest.fixture
def foreign_recipe(db, other_user):
    recipe = db.add_recipe(**RECIPE, user_id=other_user['id'])
    yield recipe
    db.delete_recipe(recipe['id'], other_user['id'])


def _starter_recipe_count(db):
    cursor = db._connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM starter_recipes")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def test_new_user_gets_a_copy_of_the_starter_recipes(db, other_user):
    starter_count = _starter_recipe_count(db)
    own_recipes = db.get_all_recipes(other_user['id'])

    assert len(own_recipes) >= starter_count
    assert starter_count > 0, "CI seeds at least one starter recipe"


def test_starter_copies_are_independent_between_users(db, test_user, other_user):
    mine = db.get_all_recipes(test_user['id'])
    theirs = db.get_all_recipes(other_user['id'])

    assert {r['id'] for r in mine}.isdisjoint({r['id'] for r in theirs})


def test_foreign_recipe_is_invisible(foreign_recipe):
    listed_ids = [r['id'] for r in client.get('/recipes').json()['recipes']]

    assert foreign_recipe['id'] not in listed_ids
    assert client.get(f"/recipes/{foreign_recipe['id']}").status_code == 404


def test_foreign_recipe_cannot_be_changed_or_deleted(db, other_user, foreign_recipe):
    assert client.patch(f"/recipes/{foreign_recipe['id']}", json={"name": "Hijacked"}).status_code == 404
    assert client.delete(f"/recipes/{foreign_recipe['id']}").status_code == 404

    assert db.get_recipe_by_id(foreign_recipe['id'], other_user['id'])['name'] == RECIPE['name']


def test_foreign_recipe_cannot_be_planned(foreign_recipe):
    response = client.post('/meal-plans', json={
        'week_start': '2030-01-07', 'day_of_week': 0, 'meal_slot': 'dinner', 'recipe_id': foreign_recipe['id']
    })

    assert response.status_code == 404


def test_meal_plans_are_per_user(db, test_user, other_user):
    own_recipe = db.get_all_recipes(test_user['id'])[0]
    entry = db.add_meal_plan_entry('2030-01-07', 1, 'lunch', own_recipe['id'], test_user['id'])
    try:
        assert [e['id'] for e in db.get_meal_plan_by_week('2030-01-07', test_user['id'])] == [entry['id']]
        assert db.get_meal_plan_by_week('2030-01-07', other_user['id']) == []
        assert db.delete_meal_plan_entry(entry['id'], other_user['id']) is False
    finally:
        db.delete_meal_plan_entry(entry['id'], test_user['id'])


def test_login_cookie_grants_access(db, test_user):
    db.set_user_password(test_user['email'], hash_password('integration-pass'))
    app.dependency_overrides.pop(get_current_user, None)
    try:
        login = client.post('/auth/login', json={'email': test_user['email'], 'password': 'integration-pass'})
        assert login.status_code == 200
        assert SESSION_COOKIE in client.cookies

        me = client.get('/auth/me')
        assert me.json()['user'] == {'id': test_user['id'], 'email': test_user['email']}
        assert client.get('/recipes').status_code == 200

        client.post('/auth/logout')
        client.cookies.clear()
        assert client.get('/recipes').status_code == 401
    finally:
        client.cookies.clear()
