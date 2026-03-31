from bson import ObjectId
from datetime import datetime
from app.db.db_connection import get_database

db = get_database()
expenses = db["expense_entry"]

def get_monthly_expenses(user_id: str, year: int, month: int):
    user_object_id = ObjectId(user_id)

    start_date = datetime(year,month,1)

    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year,month +1,1)

    docs = expenses.find({"user_id":user_object_id,
                          "is_active":True,
                          "purchase_date":{"$gte":start_date.strftime("%Y-%m-%d"),
                                           "$lte":end_date.strftime("%Y-%m-%d")}
                          }
                         )

    total_expenses = 0
    total_deposits = 0

    for doc in docs:
        amount = doc.get("amount",0)
        expense_type = doc.get("expense_type")

        if expense_type == "expense":
            total_expenses += amount
        elif expense_type == "deposit":
            total_deposits += amount

    return {
        "month": f"{year}-{str(month).zfill(2)}",
        "total expense": total_expenses,
        "total deposits": total_deposits,
        "net": round(total_expenses - total_deposits,2),
        "expenses": len(docs)
    }
