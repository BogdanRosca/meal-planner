"""
Password hashing, session tokens and the authenticated-user dependency
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Request
from pydantic import BaseModel

from .database_client import DatabaseClient

SESSION_COOKIE = "session"
JWT_ALGORITHM = "HS256"


class AuthUser(BaseModel):
    id: int
    email: str


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")
    return secret


def session_max_age_seconds() -> int:
    return int(os.getenv("JWT_EXPIRE_DAYS", "30")) * 24 * 60 * 60


def cookie_secure() -> bool:
    return os.getenv("COOKIE_SECURE", "false").lower() == "true"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: Optional[str]) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed hash stored in the DB
        return False


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=session_max_age_seconds())
    return jwt.encode({"sub": str(user_id), "exp": expires_at}, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    """Return the user id from a valid token, or None if it is invalid or expired"""
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None


def get_current_user(request: Request) -> AuthUser:
    """FastAPI dependency: resolve the logged-in user from the session cookie or reject with 401"""
    token = request.cookies.get(SESSION_COOKIE)
    user_id = decode_access_token(token) if token else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db_client = DatabaseClient()
    try:
        if not db_client.connect():
            raise HTTPException(status_code=500, detail="Failed to connect to database")
        user = db_client.get_user_by_id(user_id)
    finally:
        db_client.disconnect()

    # Token outlived its user (deleted account)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return AuthUser(id=user["id"], email=user["email"])
