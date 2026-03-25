from typing import Any

from app.models.category import create_category, delete_category, update_category, display_category_id
import re

CATEGORY_NAME_MAX_LENGTH = 25
DESCRIPTION_MAX_LENGTH = 250
NAME_REGEX = r"^[A-Za-z'-]+$"

def normalize_category_name(category_name: str) -> str:
    return (category_name or "").strip().lower()

def validate_category_name(category_name: str) -> None:
    if not category_name:
        raise ValueError("Category name cannot be empty")

    if len(category_name) > CATEGORY_NAME_MAX_LENGTH:
        raise ValueError("Category name too long")

    if not(re.fullmatch(NAME_REGEX, category_name)):
        raise ValueError("Invalid category name")

def normalize_category_description(description: str) -> str:
    return (description or "").strip()

def validate_category_description(description: str) -> None:
    if len(description) > DESCRIPTION_MAX_LENGTH:
        raise ValueError("Description too long")

def display_categories(user_id: str) -> dict[str, str | list[Any]]:
    categories = display_category_id(user_id)

    return {"user_id": user_id, "categories": categories or []}

def create_new_category(user_id: str, category_name: str, description: str):
    normalized_category_name = normalize_category_name(category_name)
    normalized_description = normalize_category_description(description)

    validate_category_name(normalized_category_name)
    validate_category_description(normalized_description)

    category = create_category(user_id, normalized_category_name, normalized_description)

    return {"user_id": user_id,
            "category": category
            }

def update_category_info(user_id: str, category_id:int,  category_name: str, description: str):
    normalized_category_name = normalize_category_name(category_name)
    normalized_description = normalize_category_description(description)

    validate_category_name(normalized_category_name)
    validate_category_description(normalized_description)

    success = update_category(
                    user_id,
                    category_id,
                    normalized_category_name,
                    normalized_description
                    )

    if not success:
        raise ValueError("Category not updated successfully")

    return {"user_id": user_id,
            "category_id": category_id,
            "category_name": normalized_category_name}

def delete_category_info(user_id: str, category_id:int):

    success = delete_category(user_id, category_id)
    if not success:
        raise ValueError("Category not deleted successfully")

    return {"user_id": user_id,
            "category_id": category_id,
            "message": "Category deleted successfully"}
