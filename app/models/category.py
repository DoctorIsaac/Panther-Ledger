from datetime import datetime, timezone

from bson import ObjectId
from app.db.db_connection import get_database
from app.db.counters import next_counter

db = get_database()
categories = db["category"]

DEFAULT_CATEGORIES = [
                    "groceries",
                    "transport",
                    "food",
                    "subscriptions",
                    "utilities",
                    "entertainment",
                    "shopping",
                    "healthcare",
                    "travel",
                    "finance",
                    "general"
                    ]

def create_category(user_id: str, name: str, description: str = ""):
    name_clean = name.strip().lower()
    user_obj_id = ObjectId(user_id)

    existing = categories.find_one({
        "user_id": user_obj_id,
        "name": name_clean,
        "is_active": True
    })

    if existing:
        raise ValueError("Category already exists")

    category_num = next_counter(f"category_{user_id}",start=0)

    doc ={
        "user_id": user_obj_id,
        "name": name_clean,
        "category_id": category_num,
        "description": description.strip(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc)}

    result = categories.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

def delete_category(user_id: str, category_id: int):
    user_obj_id = ObjectId(user_id)

    existing = categories.find_one({
        "user_id": user_obj_id,
        "category_id": category_id
    })

    if not existing:
        raise ValueError("Category does not exist")

    result = categories.update_one(
                                    {"user_id": user_obj_id,
                                    "category_id": category_id,
                                    "is_active": True},
                                {"$set":
                                    {"is_active": False,
                                     "updated_at": datetime.now(timezone.utc)}
                                 })

    if result.matched_count == 0:
        raise ValueError("Category does not exist")

    return True

def update_category(user_id: str, category_id: int, name: str, description: str = ""):
    user_obj_id = ObjectId(user_id)
    name_clean = name.strip().lower()

    duplicate = categories.find_one({"user_id": user_obj_id,
                                     "name": name_clean,
                                     "category_id": {"$ne": category_id},
                                     "is_active": True})
    if duplicate:
        raise ValueError("Another category already exists with this name")

    result = categories.update_one(
        {"user_id": user_obj_id,
         "category_id": category_id,
         "is_active": True},
        {"$set": {
            "name": name_clean,
            "description": description.strip(),
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    if result.matched_count == 0:
        raise ValueError("Category does not exist")

    return result.modified_count == 1

#general display of all categories
def display_category_id(user_id: str):
    user_obj_id = ObjectId(user_id)

    results = categories.find({"user_id": user_obj_id,
                                   "is_active": True},
                                  {
                                      "_id": 0
                                  }
                            )
    return list(results)

#specific category id search <-- not much use for it <-- may delete later
def get_category_id(user_id: str, name: str):
    user_obj_id = ObjectId(user_id)
    name_clean = name.strip().lower()

    result = categories.find_one({"user_id": user_obj_id,
                                   "name": name_clean,
                                   "is_active": True},
                                  {
                                    "_id": 0,
                                    "category_id": 1
                                  }
                            )
    if not result:
        raise ValueError("Category does not exist")

    return result["category_id"]

def get_category_by_name(user_id: str, name: str):
    user_obj_id = ObjectId(user_id)
    name_clean = name.strip().lower()

    return categories.find_one({"user_id": user_obj_id,
                                "name": name_clean,
                                "is_active": True})

def place_default_categories(user_id: str):
    user_obj_id = ObjectId(user_id)

    existing = categories.find({"user_id": user_obj_id,
                                "is_active": True
                                }
                               )

    existing_names = {c["name"] for c in existing}

    for name in DEFAULT_CATEGORIES:
        if name not in existing_names:
            create_category(
                user_id=user_id,
                name=name,
                description=f"default {name}"
            )
