from decimal import Decimal, InvalidOperation
from typing import Literal, cast
from app.models.util import date_parser

from app.models.expense_entry import create_expense_entry, update_expense_entry, delete_expense_entry
import re

EXPENSE_NAME_MAX_LENGTH = 25
DESCRIPTION_MAX_LENGTH = 250

EXPENSE_NAME_REGEX = r"^[A-Za-z0-9\s&'*-]+$"
DATE_REGEX = r"^\d{4}-\d{2}-\d{2}$"

def normalize_expense_name(expense_name: str) -> str:
    return (expense_name or "").strip().lower()

def validate_expense_name(expense_name: str) -> None:
    if not expense_name or not expense_name.strip():
        raise ValueError("Expense_name must not be empty")

    if len(expense_name) > EXPENSE_NAME_MAX_LENGTH:
        raise ValueError(f"Expense name must be less than {EXPENSE_NAME_MAX_LENGTH} characters long")

    if not (re.fullmatch(EXPENSE_NAME_REGEX, expense_name)):
        raise ValueError(f"Invalid expense name: {expense_name}")

def validate_amount(amount: Decimal) -> Decimal:
    if amount is None:
        raise ValueError("Amount cannot be None")

    try:
        amount_decimal = Decimal(amount)
    except (InvalidOperation, ValueError):
        raise ValueError("Invalid format")

    if amount_decimal < 0:
        raise ValueError("Amount cannot be negative")

    return amount_decimal

def normalize_expense_description(description: str) -> str:
    return (description or "").strip()

def validate_expense_description(description: str) -> None:

    if description and len(description) > DESCRIPTION_MAX_LENGTH:
        raise ValueError("Description too long")

def normalize_expense_type(expense_type: str) -> str:
    return (expense_type or "").strip().lower()

def validate_expense_type(expense_type: str):
    if expense_type not in ["deposit", "expense"]:
        raise ValueError("Invalid expense type")

def validate_purchase_date(purchase_date: str) -> None:
    if purchase_date and not re.fullmatch(DATE_REGEX, purchase_date):
        raise ValueError("Date must be YYYY-MM-DD")

def prepare_expense_data(
        name: str,
        amount: Decimal,
        description: str,
        purchase_date: str,
        expense_type: str
        ):

    name = normalize_expense_name(name)
    description = normalize_expense_description(description)
    expense_type = normalize_expense_type(expense_type)

    validate_expense_name(name)
    amount = validate_amount(amount)
    validate_expense_description(description)
    validate_expense_type(expense_type)
    validate_purchase_date(purchase_date)

    expense_type = cast(Literal["deposit", "expense"], expense_type)

    date_clean = date_parser(purchase_date)

    return name, amount, description, date_clean, expense_type

#Create an expense entry
def generate_expense_entry(user_id: str,
                         name: str,
                         amount: Decimal,
                         category_ref: str,
                         description: str = "",
                         purchase_date: str = "",
                         document_ref: str ="",
                         expense_type:Literal["deposit", "expense"] = "expense"):

    name, amount, description, date_clean, expense_type = prepare_expense_data(name, amount, description, purchase_date, expense_type)

    expense = create_expense_entry(user_id, name, amount, category_ref, description, date_clean, document_ref, expense_type)

    return {
        "user_id": user_id,
        "expense_name": name,
        "expense_id": expense["expense_id"]
    }

def update_customer_expense_entry(user_id: str,
                         category_ref: str,
                         amount: Decimal,
                         expense_id: int,
                         name: str,
                         purchase_date: str ="",
                         description: str = "",
                         expense_type:Literal["deposit", "expense"] = "expense"):

    name, amount, description, date_clean, expense_type = prepare_expense_data(name, amount, description, purchase_date, expense_type)

    success = update_expense_entry(user_id, name, amount, expense_id, category_ref, description, date_clean, expense_type)

    if not success:
        raise ValueError("Failed to update expense entry")

    return {
        "user_id": user_id,
        "expense_name": name,
        "expense_id": expense_id
    }

def delete_customer_expense_entry(user_id: str, expense_id: int):

    success = delete_expense_entry(user_id, expense_id)
    if not success:
        raise ValueError("Failed to delete expense entry")

    return {
        "user_id": user_id,
        "expense_id": expense_id,
        "message": "Successfully deleted expense entry"
    }



