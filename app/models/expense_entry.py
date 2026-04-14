from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from bson import ObjectId, Decimal128
from app.db.db_connection import get_database
from app.db.counters import next_counter
from app.utils.encryption import encrypt_field, decrypt_field
from typing import Literal

db = get_database()
expenses = db["expense_entry"]
categories = db["category"]

def create_expense_entry(user_id: str,
                         name: str,
                         amount: Decimal,
                         category_ref: str,
                         description: str = "",
                         purchase_date: str = "",
                         document_ref: str ="",
                         expense_type: Literal["deposit", "expense"] = "expense",
                         is_recurring: bool = False,
                         frequency: str = ""):

    user_obj_id = ObjectId(user_id)
    name_clean = name.strip().lower()
    amount_clean = Decimal(amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    amount_clean = abs(amount_clean)

    existing_expense = expenses.find_one({
        "user_id": user_obj_id,
        "name": name_clean,
        "amount": Decimal128(amount_clean),
        "purchase_date": purchase_date,
        "expense_type": expense_type,
        "is_active": True
    })
    if existing_expense:
        raise ValueError("Expense already exists")

    category_doc = None

    try:
        category_doc = categories.find_one({
            "user_id": user_obj_id,
            "category_id": int(category_ref),
            "is_active": True
        })
    except:
        pass

    if not category_doc and ObjectId.is_valid(category_ref):
        category_doc = categories.find_one({
            "_id": ObjectId(category_ref),
            "user_id": user_obj_id
        })

    if not category_doc:
        raise ValueError(f"Category does not exist: {category_ref}")

    category_obj_id = category_doc["_id"]

    # document ref
    document_obj_id = ObjectId(document_ref) if document_ref else None

    expense_num = next_counter(f"expense_entry_{user_id}", start=0)

    expense = {
        "user_id": user_obj_id,
        "category_ref": category_obj_id,
        "expense_id": expense_num,
        "name": name_clean,
        "amount": Decimal128(amount_clean),
        "expense_type": expense_type,
        "description": description.strip(),
        "is_active": True,
        "is_recurring": is_recurring,
        "frequency": frequency,
        "purchase_date": purchase_date,
        "created_at": datetime.now(timezone.utc),
        "document_ref": document_obj_id
    }

    result = expenses.insert_one(expense)
    expense["_id"] = str(result.inserted_id)
    return expense

#Edit Entry
def update_expense_entry(user_id: str,
                         category_ref: str,
                         amount: Decimal,
                         expense_id: int,
                         name: str,
                         purchase_date: str ="",
                         description: str = "",
                         expense_type:Literal["deposit", "expense"] = "expense"):
    user_obj_id = ObjectId(user_id)

    name_clean = name.strip().lower()
    amount_clean = Decimal(amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    existing_expense = expenses.find_one({
                                "user_id": user_obj_id,
                                "name": name_clean,
                                "amount": Decimal128(amount_clean),
                                "purchase_date": purchase_date,
                                "expense_id": {"$ne": expense_id},
                                "expense_type": expense_type,
                                "is_active": True
                                })
    if existing_expense:
        raise ValueError("Expense already exists")

    category_obj_id = ObjectId(category_ref)
    category_doc = categories.find_one({
        "_id": category_obj_id,
        "user_id": user_obj_id
        })

    if not category_doc:
        raise ValueError("Category does not exist")

    result = expenses.update_one({
                                "user_id": user_obj_id,
                                "expense_id": expense_id,
                                "is_active": True},
                                {"$set":{
                                "name": name_clean,
                                "category_ref": category_obj_id,
                                "amount": Decimal128(amount_clean),
                                "expense_type": expense_type,
                                "description": encrypt_field(description.strip()),
                                "purchase_date": purchase_date,
                                "updated_at": datetime.now(timezone.utc)}}
                                )

    if result.matched_count == 0:
        raise ValueError("Expense does not exist")

    return result.modified_count == 1

def delete_expense_entry(user_id: str,
                         expense_id: int):
    user_obj_id = ObjectId(user_id)

    existing = expenses.find_one({
        "user_id": user_obj_id,
        "expense_id": expense_id,
        "is_active": True}
    )
    if not existing:
        raise ValueError("Expense does not exist")

    result = expenses.update_one(
        {"user_id": user_obj_id,
         "expense_id": expense_id,
         "is_active": True},
        {"$set":
             {"is_active": False,
              "updated_at": datetime.now(timezone.utc)}
         })

    if result.matched_count == 0:
        raise ValueError("Expense does not exist")

    return True

#TODO
def display_expense_entries(user_id: str):
    user_obj_id = ObjectId(user_id)

    results = expenses.find({"user_id": user_obj_id,
                                   "is_active": True},
                                  {
                                      "_id": 0
                                  }
                            )
    return list(results)

def display_expense_entries_by_category(user_id: str):
    user_obj_id = ObjectId(user_id)

    pipeline = [
        {
            "$match": {
                "user_id": user_obj_id,
                "is_active": True
            }
        },
        {
            "$lookup": {
                "from": "category",
                "localField": "category_ref",
                "foreignField": "_id",
                "as": "category"
            }
        },
        {
            "$unwind": "$category"
        },
        {
            "$project": {
                "_id": 0,
                "expense_id": 1,
                "name": 1,
                "amount": 1,
                "expense_type": 1,
                "purchase_date": 1,
                "category_name": "$category.name"
            }
        }
    ]

    results = expenses.aggregate(pipeline)

    return list(results)

def display_recurring_entries(user_id: str):
    user_obj_id = ObjectId(user_id)

    pipeline = [
        {
            "$match": {
                "user_id": user_obj_id,
                "is_active": True,
                "is_recurring": True
            }
        },
        {
            "$lookup": {
                "from": "category",
                "localField": "category_ref",
                "foreignField": "_id",
                "as": "category"
            }
        },
        {
            "$unwind": "$category"
        },
        {
            "$project": {
                "_id": 0,
                "expense_id": 1,
                "name": 1,
                "amount": 1,
                "expense_type": 1,
                "purchase_date": 1,
                "description": 1,
                "is_recurring": 1,
                "frequency": 1,
                "category_name": "$category.name"
            }
        },
        {
            "$sort": {"purchase_date": 1}
        }
    ]

    results = list(expenses.aggregate(pipeline))
    for r in results:
        if r.get("description"):
            r["description"] = decrypt_field(r["description"])
    return results

#Assign Entry to Doc
