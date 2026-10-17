"""
Authentication endpoints: email + password login backed by an httpOnly session cookie
"""
from fastapi import APIRouter, Depends, HTTPException, Response

from ..auth import (
    SESSION_COOKIE,
    AuthUser,
    cookie_secure,
    create_access_token,
    get_current_user,
    session_max_age_seconds,
    verify_password,
)
from ..database_client import DatabaseClient
from ..models import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDENTIALS = "Invalid email or password"


@router.post("/login")
def login(credentials: LoginRequest, response: Response):
    """Verify credentials and start a session"""
    db_client = DatabaseClient()

    try:
        if not db_client.connect():
            raise HTTPException(status_code=500, detail="Failed to connect to database")

        user = db_client.get_user_by_email(credentials.email)

        # Same message for unknown email and wrong password, so accounts can't be enumerated
        if not user or not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail=INVALID_CREDENTIALS)

        response.set_cookie(
            key=SESSION_COOKIE,
            value=create_access_token(user["id"]),
            max_age=session_max_age_seconds(),
            httponly=True,
            secure=cookie_secure(),
            samesite="lax",
            path="/",
        )
        return {"status": "success", "user": {"id": user["id"], "email": user["email"]}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging in: {str(e)}")

    finally:
        db_client.disconnect()


@router.post("/logout")
def logout(response: Response):
    """End the session by clearing the cookie"""
    response.delete_cookie(key=SESSION_COOKIE, path="/", httponly=True, secure=cookie_secure(), samesite="lax")
    return {"status": "success"}


@router.get("/me")
def get_me(current_user: AuthUser = Depends(get_current_user)):
    """Return the logged-in user"""
    return {"status": "success", "user": current_user.model_dump()}
