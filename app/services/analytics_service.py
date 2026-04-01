from typing import Any

from bson import ObjectId, Decimal128
from datetime import datetime, timedelta
from app.db.db_connection import get_database

db = get_database()
expenses = db["expense_entry"]

#pass as str_date = datetime("YYYY-MM-DD")
def get_expenses_by_range(user_id: str, start_date: datetime, end_date: datetime):
    user_object_id = ObjectId(user_id)

    docs = expenses.find({"user_id":user_object_id,
                          "is_active":True,
                          "purchase_date":{"$gte":start_date.strftime("%Y-%m-%d"),
                                           "$lt":end_date.strftime("%Y-%m-%d")}
                          }
                         )

    total_expenses = 0
    total_deposits = 0
    count = 0

    for doc in docs:
        raw = doc.get("amount", 0)
        amount = float(raw.to_decimal()) if isinstance(raw, Decimal128) else float(raw)
        expense_type = doc.get("expense_type")

        if expense_type == "expense":
            total_expenses += amount
        elif expense_type == "deposit":
            total_deposits += amount
        count += 1

    return {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "total_expenses": round(total_expenses, 2),
        "total_deposits": round(total_deposits, 2),
        "net": round(total_deposits - total_expenses, 2),
        "count": count
    }

def get_monthly_expenses(user_id: str, year: int, month: int):

    start_date = datetime(year,month,1)
    if month == 12:
        end_date = datetime(year+1,1,1)
    else:
        end_date = datetime(year,month+1, 1)

    return get_expenses_by_range(user_id, start_date, end_date)


def get_yearly_expenses(user_id: str, year: int, month: int):
    start_date = datetime(year, 1, 1)
    end_date = datetime(year+1,1,1)

    return get_expenses_by_range(user_id, start_date, end_date)

#weekly summary from work week
def get_weekly_expenses(user_id: str, year: int, month: int, day: int):

    input_date = datetime(year, month, day)
    start_date, end_date = get_week_bound(input_date)

    return get_expenses_by_range(user_id, start_date, end_date)

def get_week_bound(current_date: datetime):
    start = current_date - timedelta(days=current_date.weekday())
    end = start + timedelta(days=7)
    return start, end

def get_category_spending(user_id: str, start_date: datetime, end_date: datetime):
    user_object_id = ObjectId(user_id)

    pipeline = [
        {
            "$match": {
                "user_id": user_object_id,
                "is_active": True,
                "expense_type": "expense",
                "purchase_date": {
                    "$gte": start_date.strftime("%Y-%m-%d"),
                    "$lt": end_date.strftime("%Y-%m-%d")
                }
            }
        },
        {
            "$group": {
                "_id": "$category_ref",
                "total": {"$sum": "$amount"}
            }
        },
        {
            "$lookup": {
                "from": "category",
                "localField": "_id",
                "foreignField": "_id",
                "as": "category_info"
            }
        },
        {
            "$unwind": "$category_info"
        },
        {
            "$project": {
                "_id": 0,
                "category": "$category_info.name",
                "total": {"$round": ["$total", 2]}
            }
        },
        {
            "$sort": {"total": -1}
        }
    ]

    results = list(expenses.aggregate(pipeline))
    return results

def get_monthly_spending_by_category(user_id: str, year: int, month: int):
    start = datetime(year, month, 1)

    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)

    return get_category_spending(user_id, start, end)

def get_weekly_spending_by_category(user_id: str, year: int, month: int, day: int):

    input_date = datetime(year, month, day)
    start_date, end_date = get_week_bound(input_date)

    return get_category_spending(user_id, start_date, end_date)

def search_expense(user_id: str,
                   name: str = None,
                   category_ref: str = None,
                   start_date: datetime = None,
                   end_date: datetime = None,
                   min_amount: int = None,
                   max_amount: int = None,
                   expense_type: str = None,
                   page: int = 0,
                   limit: int = 50,
                   sort_by: str = "date",
                   order_by: str = "desc"):

    db_query: dict[str, Any] = {
        "user_id": ObjectId(user_id),
        "is_active": True
    }

    sorting_field ={
        "date": "purchase_date",
        "amount": "amount"
    }

    if name:
        db_query["name"] = {
            "$regex": name.lower(),
            "$options": "i"
        }

    if category_ref:
        db_query["category_ref"] = ObjectId(category_ref)

    if start_date or end_date:
        db_query["purchase_date"] = {}

        if start_date:
            db_query["purchase_date"]["$gte"] = start_date

        if end_date:
            db_query["purchase_date"]["$lte"] = end_date

    if min_amount is not None and max_amount is not None:
        db_query["purchase_amount"] = {}

        if min_amount is not None:
            db_query["amount"]["$gte"] = float(min_amount)

        if max_amount is not None:
            db_query["amount"]["$lte"] = float(max_amount)

    if expense_type:
        db_query["expense_type"] = expense_type

    skip = page * limit
    num_of_items = expenses.count_documents(db_query)

    sorting_by_date = sorting_field.get(sort_by, "purchase_date")
    sorting_by_order = 1 if order_by == "asc" else -1

    results = list(expenses.find(db_query)
                   .sort(sorting_by_date,sorting_by_order)
                   .skip(skip).
                   limit(limit))

    return {
        "results": results,
        "num_of_items": num_of_items,
        "page": page,
        "limit": limit,
        "total_pages": (num_of_items + limit -1 ) // limit
    }


