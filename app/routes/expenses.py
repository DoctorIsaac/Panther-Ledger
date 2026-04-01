from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional

from app.services.expense_service import (
    generate_expense_entry,
    update_customer_expense_entry,
    delete_customer_expense_entry,
)
from app.models.expense_entry import display_expense_entries_by_category
from app.routes.serializers import serialize

router = APIRouter(prefix="/expenses", tags=["expenses"])


class ExpenseCreate(BaseModel):
    name: str
    amount: float
    category_ref: str
    description: Optional[str] = ""
    purchase_date: Optional[str] = ""
    document_ref: Optional[str] = ""
    expense_type: Literal["deposit", "expense"] = "expense"
    is_recurring: bool = False
    frequency: Optional[str] = ""


class ExpenseUpdate(BaseModel):
    name: str
    amount: float
    category_ref: str
    purchase_date: Optional[str] = ""
    description: Optional[str] = ""
    expense_type: Literal["deposit", "expense"] = "expense"
    is_recurring: bool = False
    frequency: Optional[str] = ""


@router.get("/{user_id}")
def get_expenses(user_id: str):
    try:
        results = display_expense_entries_by_category(user_id)
        return serialize(results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}")
def create_expense(user_id: str, data: ExpenseCreate):
    try:
        result = generate_expense_entry(
            user_id=user_id,
            name=data.name,
            amount=data.amount,
            category_ref=data.category_ref,
            description=data.description,
            purchase_date=data.purchase_date,
            document_ref=data.document_ref,
            expense_type=data.expense_type,
            is_recurring=data.is_recurring,
            frequency=data.frequency or "",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}/{expense_id}")
def update_expense(user_id: str, expense_id: int, data: ExpenseUpdate):
    try:
        return update_customer_expense_entry(
            user_id=user_id,
            category_ref=data.category_ref,
            amount=data.amount,
            expense_id=expense_id,
            name=data.name,
            purchase_date=data.purchase_date,
            description=data.description,
            expense_type=data.expense_type,
            is_recurring=data.is_recurring,
            frequency=data.frequency or "",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}/{expense_id}")
def delete_expense(user_id: str, expense_id: int):
    try:
        return delete_customer_expense_entry(user_id, expense_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
