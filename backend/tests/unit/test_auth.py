"""
Unit tests for authentication: password hashing, session tokens, auth endpoints and route protection
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient

from app.auth import (
    SESSION_COOKIE,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.database_client import DatabaseClient
from app.main import app

client = TestClient(app)

STORED_USER = {'id': 7, 'email': 'cook@example.com', 'password_hash': hash_password('correct-horse')}


def _mock_db(mock_db_class, connect=True):
    mock_db = Mock()
    mock_db.connect.return_value = connect
    mock_db_class.return_value = mock_db
    return mock_db


class TestPasswordHashing:

    def test_hash_verifies_and_is_salted(self):
        first = hash_password('secret-pass')
        second = hash_password('secret-pass')

        assert first != second
        assert verify_password('secret-pass', first)
        assert not verify_password('wrong-pass', first)

    def test_accepts_pgcrypto_style_2a_hash(self):
        # pgcrypto crypt(..., gen_salt('bf')) produces $2a$ hashes
        pgcrypto_hash = bcrypt.hashpw(b'from-sql', bcrypt.gensalt(prefix=b'2a')).decode()

        assert verify_password('from-sql', pgcrypto_hash)

    @pytest.mark.parametrize('stored', [None, '', 'not-a-bcrypt-hash'])
    def test_rejects_missing_or_malformed_hash(self, stored):
        assert not verify_password('anything', stored)


class TestAccessToken:

    def test_round_trip(self):
        assert decode_access_token(create_access_token(42)) == 42

    def test_rejects_expired_token(self):
        expired = jwt.encode(
            {'sub': '42', 'exp': datetime.now(timezone.utc) - timedelta(seconds=1)},
            'test-only-secret-not-for-production', algorithm='HS256'
        )

        assert decode_access_token(expired) is None

    def test_rejects_token_signed_with_other_secret(self):
        forged = jwt.encode({'sub': '42'}, 'someone-elses-secret', algorithm='HS256')

        assert decode_access_token(forged) is None

    def test_rejects_garbage(self):
        assert decode_access_token('not.a.jwt') is None

    def test_missing_secret_is_a_configuration_error(self, monkeypatch):
        monkeypatch.delenv('JWT_SECRET', raising=False)

        with pytest.raises(RuntimeError):
            create_access_token(1)


class TestLoginEndpoint:

    @patch('app.routes.auth.DatabaseClient')
    def test_login_sets_httponly_session_cookie(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_email.return_value = STORED_USER

        response = client.post('/auth/login', json={'email': ' Cook@Example.com ', 'password': 'correct-horse'})

        assert response.status_code == 200
        body = response.json()
        assert body['status'] == 'success'
        assert body['user'] == {'id': 7, 'email': 'cook@example.com'}
        assert decode_access_token(body['access_token']) == 7
        mock_db.get_user_by_email.assert_called_once_with('cook@example.com')
        set_cookie = response.headers['set-cookie']
        assert f'{SESSION_COOKIE}=' in set_cookie
        assert 'HttpOnly' in set_cookie
        assert 'samesite=lax' in set_cookie.lower()
        assert decode_access_token(response.cookies[SESSION_COOKIE]) == 7
        mock_db.disconnect.assert_called_once()

    @patch('app.routes.auth.DatabaseClient')
    def test_wrong_password_returns_401(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_email.return_value = STORED_USER

        response = client.post('/auth/login', json={'email': 'cook@example.com', 'password': 'nope'})

        assert response.status_code == 401
        assert response.json()['detail'] == 'Invalid email or password'
        assert 'set-cookie' not in response.headers

    @patch('app.routes.auth.DatabaseClient')
    def test_unknown_email_returns_same_401(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_email.return_value = None

        response = client.post('/auth/login', json={'email': 'ghost@example.com', 'password': 'whatever'})

        assert response.status_code == 401
        assert response.json()['detail'] == 'Invalid email or password'

    @patch('app.routes.auth.DatabaseClient')
    def test_user_without_password_cannot_log_in(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_email.return_value = {**STORED_USER, 'password_hash': None}

        response = client.post('/auth/login', json={'email': 'cook@example.com', 'password': ''})

        assert response.status_code == 401

    def test_invalid_email_is_rejected(self):
        response = client.post('/auth/login', json={'email': 'not-an-email', 'password': 'x'})

        assert response.status_code == 422

    @patch('app.routes.auth.DatabaseClient')
    def test_connection_failure_returns_500(self, mock_db_class):
        _mock_db(mock_db_class, connect=False)

        response = client.post('/auth/login', json={'email': 'cook@example.com', 'password': 'x'})

        assert response.status_code == 500

    @patch('app.routes.auth.DatabaseClient')
    def test_database_error_returns_500(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_email.side_effect = Exception('boom')

        response = client.post('/auth/login', json={'email': 'cook@example.com', 'password': 'x'})

        assert response.status_code == 500
        mock_db.disconnect.assert_called_once()


class TestCrossSiteCookie:

    @patch('app.routes.auth.DatabaseClient')
    def test_samesite_none_forces_secure(self, mock_db_class, monkeypatch):
        monkeypatch.setenv('COOKIE_SAMESITE', 'none')
        monkeypatch.delenv('COOKIE_SECURE', raising=False)
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_email.return_value = STORED_USER

        response = client.post('/auth/login', json={'email': 'cook@example.com', 'password': 'correct-horse'})

        set_cookie = response.headers['set-cookie'].lower()
        assert 'samesite=none' in set_cookie
        assert 'secure' in set_cookie

    def test_logout_uses_same_cookie_attributes(self, monkeypatch):
        monkeypatch.setenv('COOKIE_SAMESITE', 'none')

        set_cookie = client.post('/auth/logout').headers['set-cookie'].lower()

        assert 'samesite=none' in set_cookie
        assert 'secure' in set_cookie

    def test_invalid_samesite_is_a_configuration_error(self, monkeypatch):
        monkeypatch.setenv('COOKIE_SAMESITE', 'sometimes')

        with pytest.raises(RuntimeError, match='COOKIE_SAMESITE'):
            client.post('/auth/logout')


class TestLogoutEndpoint:

    def test_logout_expires_cookie(self):
        response = client.post('/auth/logout')

        assert response.status_code == 200
        set_cookie = response.headers['set-cookie']
        assert f'{SESSION_COOKIE}=' in set_cookie
        assert 'Max-Age=0' in set_cookie


@pytest.mark.unauthenticated
class TestCurrentUser:

    def teardown_method(self):
        client.cookies.clear()

    @patch('app.auth.DatabaseClient')
    def test_me_returns_user_from_cookie(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_id.return_value = {'id': 7, 'email': 'cook@example.com'}
        client.cookies.set(SESSION_COOKIE, create_access_token(7))

        response = client.get('/auth/me')

        assert response.status_code == 200
        assert response.json() == {'status': 'success', 'user': {'id': 7, 'email': 'cook@example.com'}}
        mock_db.get_user_by_id.assert_called_once_with(7)
        mock_db.disconnect.assert_called_once()

    @patch('app.auth.DatabaseClient')
    def test_me_returns_user_from_bearer_token(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_id.return_value = {'id': 7, 'email': 'cook@example.com'}

        response = client.get('/auth/me', headers={'Authorization': f'Bearer {create_access_token(7)}'})

        assert response.status_code == 200
        mock_db.get_user_by_id.assert_called_once_with(7)

    @patch('app.auth.DatabaseClient')
    def test_bearer_token_wins_over_cookie(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_id.return_value = {'id': 8, 'email': 'other@example.com'}
        client.cookies.set(SESSION_COOKIE, create_access_token(7))

        client.get('/auth/me', headers={'Authorization': f'Bearer {create_access_token(8)}'})

        mock_db.get_user_by_id.assert_called_once_with(8)

    @pytest.mark.parametrize('header', ['Bearer tampered', 'Bearer ', 'Basic abc', 'garbage'])
    def test_invalid_authorization_header_returns_401(self, header):
        assert client.get('/auth/me', headers={'Authorization': header}).status_code == 401

    def test_me_without_cookie_returns_401(self):
        assert client.get('/auth/me').status_code == 401

    def test_invalid_cookie_returns_401(self):
        client.cookies.set(SESSION_COOKIE, 'tampered')

        assert client.get('/auth/me').status_code == 401

    @patch('app.auth.DatabaseClient')
    def test_deleted_user_returns_401(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.get_user_by_id.return_value = None
        client.cookies.set(SESSION_COOKIE, create_access_token(7))

        assert client.get('/auth/me').status_code == 401

    @patch('app.auth.DatabaseClient')
    def test_connection_failure_returns_500(self, mock_db_class):
        _mock_db(mock_db_class, connect=False)
        client.cookies.set(SESSION_COOKIE, create_access_token(7))

        assert client.get('/auth/me').status_code == 500

    @pytest.mark.parametrize('method,path', [
        ('get', '/recipes'),
        ('get', '/recipes/1'),
        ('post', '/recipes'),
        ('patch', '/recipes/1'),
        ('delete', '/recipes/1'),
        ('get', '/meal-plans?week_start=2026-03-02'),
        ('post', '/meal-plans'),
        ('delete', '/meal-plans/1'),
        ('post', '/recipes/import/youtube'),
        ('post', '/recipes/import/instagram'),
        ('post', '/recipes/import/facebook'),
    ])
    def test_protected_routes_require_login(self, method, path):
        response = getattr(client, method)(path)

        assert response.status_code == 401

    def test_health_stays_public(self):
        assert client.get('/health').status_code != 401


class TestMealPlanOwnership:

    @patch('app.routes.meal_plans.DatabaseClient')
    def test_planning_someone_elses_recipe_returns_404(self, mock_db_class):
        mock_db = _mock_db(mock_db_class)
        mock_db.add_meal_plan_entry.return_value = None

        response = client.post('/meal-plans', json={
            'week_start': '2026-03-02', 'day_of_week': 0, 'meal_slot': 'breakfast', 'recipe_id': 99
        })

        assert response.status_code == 404


class TestUserDatabaseMethods:

    def _client_with_cursor(self):
        db = DatabaseClient()
        connection = Mock()
        cursor = Mock()
        connection.cursor.return_value = cursor
        db._connection = connection
        return db, connection, cursor

    def test_get_user_by_email_normalizes_input(self):
        db, _, cursor = self._client_with_cursor()
        cursor.fetchone.return_value = (7, 'cook@example.com', 'hash')

        with patch.object(db, 'is_connected', return_value=True):
            user = db.get_user_by_email('  Cook@Example.COM ')

        assert user == {'id': 7, 'email': 'cook@example.com', 'password_hash': 'hash'}
        assert cursor.execute.call_args[0][1] == ('cook@example.com',)

    def test_get_user_by_email_not_found(self):
        db, _, cursor = self._client_with_cursor()
        cursor.fetchone.return_value = None

        with patch.object(db, 'is_connected', return_value=True):
            assert db.get_user_by_email('ghost@example.com') is None

    def test_get_user_by_id(self):
        db, _, cursor = self._client_with_cursor()
        cursor.fetchone.side_effect = [(7, 'cook@example.com'), None]

        with patch.object(db, 'is_connected', return_value=True):
            assert db.get_user_by_id(7) == {'id': 7, 'email': 'cook@example.com'}
            assert db.get_user_by_id(8) is None

    def test_create_user_copies_starter_recipes_in_one_transaction(self):
        db, connection, cursor = self._client_with_cursor()
        cursor.fetchone.return_value = (9, 'new@example.com')

        with patch.object(db, 'is_connected', return_value=True):
            user = db.create_user('New@Example.com', 'hash')

        assert user == {'id': 9, 'email': 'new@example.com'}
        insert_user, copy_recipes = cursor.execute.call_args_list
        assert insert_user[0][1] == ('new@example.com', 'hash')
        assert 'FROM starter_recipes' in copy_recipes[0][0]
        assert copy_recipes[0][1] == (9,)
        connection.commit.assert_called_once()
        connection.rollback.assert_not_called()

    def test_create_user_rolls_back_on_failure(self):
        db, connection, cursor = self._client_with_cursor()
        cursor.fetchone.return_value = (9, 'new@example.com')
        cursor.execute.side_effect = [None, Exception('copy failed')]

        with patch.object(db, 'is_connected', return_value=True):
            with pytest.raises(Exception, match='copy failed'):
                db.create_user('new@example.com', 'hash')

        connection.rollback.assert_called_once()
        connection.commit.assert_not_called()
        cursor.close.assert_called_once()

    @pytest.mark.parametrize('rowcount,expected', [(1, True), (0, False)])
    def test_set_user_password(self, rowcount, expected):
        db, connection, cursor = self._client_with_cursor()
        cursor.rowcount = rowcount

        with patch.object(db, 'is_connected', return_value=True):
            assert db.set_user_password('Cook@Example.com', 'new-hash') is expected

        assert cursor.execute.call_args[0][1] == ('new-hash', 'cook@example.com')

    @pytest.mark.parametrize('method,args', [
        ('get_user_by_email', ('a@b.c',)),
        ('get_user_by_id', (1,)),
        ('create_user', ('a@b.c', 'hash')),
        ('set_user_password', ('a@b.c', 'hash')),
    ])
    def test_requires_connection(self, method, args):
        db = DatabaseClient()

        with patch.object(db, 'is_connected', return_value=False):
            with pytest.raises(Exception, match='Not connected'):
                getattr(db, method)(*args)
