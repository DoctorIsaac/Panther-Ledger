from bson import ObjectId, Decimal128
from datetime import datetime
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

