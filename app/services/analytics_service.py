from bson import ObjectId
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

    for doc in docs:
        amount = float(doc.get("amount", 0))
        expense_type = doc.get("expense_type")

        if expense_type == "expense":
            total_expenses += amount
        elif expense_type == "deposit":
            total_deposits += amount

    return {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "total_expenses": round(total_expenses, 2),
        "total_deposits": round(total_deposits, 2),
        "net": round(total_deposits - total_expenses, 2),
        "count": len(docs)
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

