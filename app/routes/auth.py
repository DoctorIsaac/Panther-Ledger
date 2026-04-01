from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.db.db_connection import get_database
from app.db.pass_util import verify_password
from app.services.customer_service import register_customer

router = APIRouter(prefix="/auth", tags=["auth"])

db = get_database()
users = db["users"]


class SignupRequest(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str] = "000-000-0000"
    address: Optional[str] = "Not provided"
    zip_code: Optional[str] = "00000"


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(data: SignupRequest):
    try:
        result = register_customer(
            username=data.username,
            password=data.password,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone_number=data.phone_number,
            address=data.address,
            zip_code=data.zip_code,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(data: LoginRequest):
    user = users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Successfully logged in",
        "user_id": str(user["_id"]),
        "username": user["username"],
        "first_name": user.get("first_name", ""),
    }
