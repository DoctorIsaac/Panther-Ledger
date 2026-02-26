from datetime import datetime, timezone
from bson import ObjectId
from app.db.db_connection import get_database
from app.db.counters import next_counter
from .expense_entry import create_expense_entry

#Upload to Git

db = get_database()
documents = db["document"]

def create_document(user_id: str, file_name: str, description: str, file_type: str ="pdf" ):
    user_obj_id = ObjectId(user_id)
    file_name_clean = file_name.strip()

    if not file_name_clean:
        raise ValueError("file_name must not be empty")

    existing = documents.find_one({"user_id": user_obj_id,
                                  "file_name": file_name_clean,
                                  "is_active": True}
                                 )

    if existing:
        raise ValueError("Document already exists")

    document_id = next_counter(f"document_{user_id}",start=0)

    doc = {
        "user_id": user_obj_id,
        "document_id": document_id,
        "file_name": file_name_clean,
        "description": description.strip(),
        "file_type": file_type.strip().lower(),
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
        "linked_expenses": []
    }

    result = documents.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

def delete_document(user_id: str, document_id: int):
    user_obj_id = ObjectId(user_id)

    existing = documents.find_one({
        "user_id": user_obj_id,
        "document_id": document_id,
        "is_active": True}
    )
    if not existing:
        raise ValueError("Document does not exist")

    result = documents.update_one(
        {"user_id": user_obj_id,
         "document_id": document_id,
         "is_active": True},
        {"$set":
             {"is_active": False,
              "updated_at": datetime.now(timezone.utc)}
         })

    if result.matched_count == 0:
        raise ValueError("Document does not exist")

    return True

def add_expense_to_document(user_id: str, document_ref: str, items: list, default_purchase_date: str = ""):
    user_obj_id = ObjectId(user_id)
    doc_obj_id = ObjectId(document_ref)

    doc = documents.find_one({"_id": doc_obj_id,
                              "user_id": user_obj_id,
                              "is_active": True})

    if not doc:
        raise ValueError("Document does not exist")

    if not items or not isinstance(items, list):
        raise ValueError("items must be a list")

    expense_ids = []
    expense_obj_ids = []
    duplicates = 0

    for i, item in enumerate(items, start=1):
        name = (item.get("name") or "").strip()
        amount = item.get("amount", None)
        category_ref = (item.get("category_ref") or "").strip()
        description = (item.get("description") or "").strip()

        purchase_date = (item.get("purchase_date") or "").strip()
        if not purchase_date:
            purchase_date = default_purchase_date

        if not name or amount is None or not category_ref:
            raise ValueError(f"Item #{i} missing required fields (name, amount, category_ref)")

        try:
            exp = create_expense_entry(
                user_id=user_id,
                name=name,
                amount=amount,
                category_ref=category_ref,
                description=description,
                purchase_date=purchase_date,
                document_ref=document_ref
            )

            expense_ids.append(exp["expense_id"])
            expense_obj_ids.append(exp["_id"])

        except ValueError as e:
            if str(e) == "Expense already exists":
                duplicates += 1
                continue
            raise

    documents.update_one(
            {
                "_id": doc_obj_id,
                "user_id": user_obj_id,
                "is_active": True
            },
            {
                "$addToSet": {
                    "linked_expense_ids": {"$each": expense_ids},
                    "linked_expense_object_ids": {"$each": expense_obj_ids}
                },
                "$set": {
                    "parsed_status": "parsed",
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

    return {
            "document_ref": document_ref,
            "created_count": len(expense_ids),
            "skipped_duplicates":duplicates,
            "expense_ids":expense_ids
    }
