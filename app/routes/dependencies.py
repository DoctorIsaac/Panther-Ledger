from fastapi import Header, HTTPException, Depends

from app.db.db_connection import get_database

db = get_database()
users_col = db["users"]


def get_current_user(x_session_token: str = Header(...)) -> str:
    """Validates the session token and returns the authenticated user's ID."""
    user = users_col.find_one({"session_token": x_session_token}, {"_id": 1})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return str(user["_id"])


def require_owner(user_id: str, current_user: str = Depends(get_current_user)) -> str:
    """Ensures the authenticated user matches the user_id in the path."""
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user
