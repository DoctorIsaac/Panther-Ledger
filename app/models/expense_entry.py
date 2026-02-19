from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from bson import ObjectId
from app.db.db_connection import get_database
from app.db.counters import next_counter
from .util import date_parser

db = get_database()
expenses = db["expense_entry"]
categories = db["category"]

def create_expense_entry(user_id: str, name: str, amount: Decimal, category_ref: str, description: str = "", purchase_date: str = ""):
    user_obj_id = ObjectId(user_id)
    name_clean = name.strip().lower()
    amount_clean = Decimal(amount).quantize(Decimal("0.01"),rounding=ROUND_HALF_UP)
    date_clean = date_parser(purchase_date)

#Checks if expense has already been previously entered
#Needs to be fixed in case of two identical purchases at same time
    existing_expense = expenses.find_one({"user_id": user_obj_id, "name": name_clean, "amount": amount_clean})
    if existing_expense:
        raise ValueError("Expense already exists")

# Checks if category exists
    category_obj_id = ObjectId(category_ref)
    category_doc = categories.find_one({
                    "_id": category_obj_id,
                    "user_id": user_obj_id,
                    "is_active": True ,})

    if not category_doc:
        raise ValueError("Category does not exist")

    expense_num = next_counter(f"expense_entry_{user_id}",start=0)

    expense = {
                "user_id": user_obj_id,
                "category_ref": category_obj_id,
                "expense_id": expense_num,
                "name": name_clean,
                "amount": float(amount_clean),
                "description": description.strip(),
                "purchase_date": date_clean,
                "created_at": datetime.now(timezone.utc)
    }

    result = expenses.insert_one(expense)
    expense["_id"] = str(result.inserted_id)
    return expense

#TODO
#Edit Entry
#Delete Entry
#Assign Entry to Doc
