import re as _re
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from bson import ObjectId, Decimal128
from app.db.db_connection import get_database
from app.db.counters import next_counter
from app.utils.encryption import encrypt_field, decrypt_field
from typing import Literal, List

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

# Patterns used to normalize transaction names for recurring detection.
# Bank statements embed the authorization date in the description
# (e.g. "Recurring Payment authorized on 12/29 Apple.Com/Bill"), which
# makes every month look like a unique name.  We strip that noise so the
# merchant name is the stable grouping key.
_STRIP_AUTH_DATE_RE = _re.compile(
    r'\bauthorized\s+on\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b', _re.IGNORECASE
)
_STRIP_ON_DATE_RE = _re.compile(
    r'\bon\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b', _re.IGNORECASE
)
_TX_PREFIXES = (
    'recurring payment ', 'recurring purchase ', 'recurring ',
    'purchase ', 'payment ',
)

def _merchant_key(name: str) -> str:
    """Return a stable merchant identifier stripped of dates and banking boilerplate."""
    n = _STRIP_AUTH_DATE_RE.sub('', name)
    n = _STRIP_ON_DATE_RE.sub('', n)
    n_lower = n.strip().lower()
    for prefix in _TX_PREFIXES:
        if n_lower.startswith(prefix):
            n_lower = n_lower[len(prefix):]
            break
    return ' '.join(n_lower.split())


def _infer_frequency(dates: List[str]) -> str:
    """Infer recurring frequency from a sorted list of YYYY-MM-DD date strings."""
    parsed = []
    for d in dates:
        try:
            parsed.append(datetime.strptime(d, "%Y-%m-%d"))
        except Exception:
            pass

    if len(parsed) < 2:
        return "monthly"

    gaps = [(parsed[i] - parsed[i - 1]).days for i in range(1, len(parsed)) if (parsed[i] - parsed[i - 1]).days > 0]
    if not gaps:
        return "monthly"

    avg_gap = sum(gaps) / len(gaps)
    if avg_gap <= 10:
        return "weekly"
    elif avg_gap <= 20:
        return "bi-weekly"
    else:
        return "monthly"


def detect_and_flag_recurring(user_id: str) -> int:
    """
    Scan bank-statement transactions for a user and auto-flag recurring ones.

    A charge is considered recurring when the same (name, amount, expense_type)
    appears in at least 3 distinct uploaded bank statements (document_ref).
    Returns the number of transaction groups newly flagged.
    """
    user_obj_id = ObjectId(user_id)

    # Only consider transactions imported from bank statements
    all_txns = list(expenses.find({
        "user_id": user_obj_id,
        "is_active": True,
        "document_ref": {"$exists": True, "$ne": None}
    }))

    if not all_txns:
        return 0

    # Group by (merchant_key, amount, expense_type).
    # merchant_key strips embedded authorization dates and banking prefixes so
    # that "recurring payment authorized on 12/29 apple.com/bill" and
    # "recurring payment authorized on 01/20 apple.com/bill" map to the same
    # group ("apple.com/bill") and can be detected as recurring.
    groups: dict = {}
    for txn in all_txns:
        try:
            amt = str(Decimal(str(txn["amount"])).quantize(Decimal("0.01")))
        except Exception:
            amt = "0.00"
        key = (_merchant_key(txn.get("name", "")), amt, txn.get("expense_type", "expense"))
        groups.setdefault(key, []).append(txn)

    flagged_groups = 0

    for key, txns in groups.items():
        distinct_docs = {str(t["document_ref"]) for t in txns if t.get("document_ref")}

        if len(distinct_docs) >= 5:
            dates = sorted(t["purchase_date"] for t in txns if t.get("purchase_date"))
            frequency = _infer_frequency(dates)

            expense_ids = [t["expense_id"] for t in txns]
            result = expenses.update_many(
                {
                    "user_id": user_obj_id,
                    "expense_id": {"$in": expense_ids},
                    "is_active": True,
                    "is_recurring": False
                },
                {"$set": {
                    "is_recurring": True,
                    "frequency": frequency,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            if result.modified_count > 0:
                flagged_groups += 1

    return flagged_groups


#Assign Entry to Doc
