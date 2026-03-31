from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.category_service import (
    display_categories,
    create_new_category,
    update_category_info,
    delete_category_info,
)
from app.routes.serializers import serialize

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    category_name: str
    description: Optional[str] = ""


class CategoryUpdate(BaseModel):
    category_name: str
    description: Optional[str] = ""


@router.get("/{user_id}")
def get_categories(user_id: str):
    try:
        result = display_categories(user_id)
        return serialize(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}")
def create_category(user_id: str, data: CategoryCreate):
    try:
        result = create_new_category(user_id, data.category_name, data.description)
        return serialize(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}/{category_id}")
def update_category(user_id: str, category_id: int, data: CategoryUpdate):
    try:
        return update_category_info(user_id, category_id, data.category_name, data.description)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}/{category_id}")
def delete_category(user_id: str, category_id: int):
    try:
        return delete_category_info(user_id, category_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
