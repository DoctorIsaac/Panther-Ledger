from app.models.document import create_document, delete_document, add_expense_to_document
from app.services.expense_service import validate_amount
from decimal import Decimal

import re

CATEGORY_NAME_MAX_LENGTH = 25
DESCRIPTION_MAX_LENGTH = 250
NAME_REGEX = r"^[A-Za-z0-9_.\- ]+$"

def normalize_file_name(file_name: str) -> str:
    return (file_name or "").strip()

def validate_file_name(file_name: str) -> None:
    if not file_name:
        raise ValueError("File name cannot be empty")

    if len(file_name) > CATEGORY_NAME_MAX_LENGTH:
        raise ValueError("File name too long")

    if not(re.fullmatch(NAME_REGEX, file_name)):
        raise ValueError("Invalid file name")

def normalize_category_ref(category_ref: str) -> str:
    return (category_ref or "").strip()

def validate_category_ref(category_ref: str) -> None:
    if not category_ref:
        raise ValueError("Category ref cannot be empty")

def normalize_name(name: str) -> str:
    return (name or "").strip()

def validate_name(name: str) -> None:
    if not name:
        raise ValueError("Expense name cannot be empty")

    if not re.fullmatch(NAME_REGEX, name):
        raise ValueError("Invalid expense name")

def normalize_description(description: str) -> str:
    return (description or "").strip()

def validate_description(description: str) -> None:
    if not description:
        raise ValueError("Description cannot be empty")

    if len(description) > DESCRIPTION_MAX_LENGTH:
        raise ValueError("Description too long")

def create_new_document(user_id: str, file_name: str, description: str, file_type: str ="pdf"):
    normalized_file_name = normalize_file_name(file_name)
    normalized_description = normalize_description(description)

    validate_file_name(normalized_file_name)
    validate_description(normalized_description)

    document = create_document(user_id, normalized_file_name, normalized_description, file_type)

    return {
        "user_id": user_id,
        "document": document
    }

def add_new_expense_to_document(user_id: str,document_ref: str,name: str,amount: float,category_ref: str,description: str,purchase_date: str = ""):
    normalized_description = normalize_description(description)
    normalized_name = normalize_name(name)
    normalized_category_ref = normalize_category_ref(category_ref)
    amount = Decimal(str(amount))

    validate_name(normalized_name)
    validate_description(normalized_description)
    validate_category_ref(normalized_category_ref)
    validate_amount(amount)

    item = {
        "name": normalized_name,
        "amount": float(amount),
        "category_ref": normalized_category_ref,
        "description": normalized_description,
        "expense_type": "expense",
        "purchase_date": purchase_date
    }

    result = add_expense_to_document(
        user_id=user_id,
        document_ref=document_ref,
        items=[item],
        default_purchase_date=purchase_date
    )

    return {
        "user_id": user_id,
        "document_ref": document_ref,
        "result": result
    }



def delete_user_document(user_id: str, document_id: int):

    success = delete_document(user_id, document_id)
    if not success:
        raise ValueError("Document deletion failed")

    return {"user_id": user_id,
            "document": document_id,
            "message": "Document deleted successfully"
            }
