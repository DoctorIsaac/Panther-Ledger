import re
import pdfplumber
from decimal import Decimal
from datetime import datetime, timezone
from bson import ObjectId

from app.db.db_connection import get_database
from app.db.counters import next_counter
from app.models.document import create_document, add_expense_to_document
from app.models.category import place_default_categories
from app.models.category import get_category_by_name
from app.ml.categorizer_service import ml_predict_expense_category


db = get_database()
categories = db["category"]
documents = db["document"]

#utils
MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12
}

def clean_amount(amount: str):
    s = (amount or "").strip()

    if s.endswith("-"):
        s = "-" + s[:-1].strip()

    s = s.replace("$", "").replace(",", "").strip()

    if s.startswith("(") and s.endswith(")"):
        s = "-" + s[1:-1].strip()

    return Decimal(s).quantize(Decimal("0.01"))

def extract_statement_end_year(raw_text: str) -> int:
    m = re.search(r"([A-Za-z]+)\s+\d{1,2}\s*-\s*([A-Za-z]+)\s+\d{1,2},\s*(\d{4})", raw_text)
    if not m:
        return datetime.now().year
    return int(m.group(3))

def infer_year_for_mmdd(mm: int, statement_end_year: int, raw_text: str) -> int:
    m = re.search(r"([A-Za-z]+)\s+\d{1,2}\s*-\s*([A-Za-z]+)\s+\d{1,2},\s*(\d{4})", raw_text)
    if not m:
        return statement_end_year

    start_m = MONTHS.get(m.group(1).lower())
    end_m = MONTHS.get(m.group(2).lower())

    if not start_m or not end_m:
        return statement_end_year

    if start_m > end_m:
        return statement_end_year - 1 if mm >= start_m else statement_end_year

    return statement_end_year

def is_date_mmdd(s: str):
    s = s.strip()
    return bool(re.fullmatch(r"\d{1,2}/\d{1,2}", s) or re.fullmatch(r"\d{1,2}-\d{1,2}", s))

def is_amount(s: str):
    return bool(re.fullmatch(r"\(?-?\$?[\d,]+\.\d{2}\)?", s.strip()))

def detect_account_type(raw_text: str) -> str:
    lower = raw_text.lower()

    #Checks if credit card
    if "visa" in lower or "mastercard" in lower or "american express" in lower:
        return "credit_card"

    if "purchases and adjustments" in lower:
        return "credit_card"

    if "payments and other credits" in lower:
        return "credit_card"

    #Checks if checking account
    if "checking account" in lower or "savings account" in lower:
        return "bank"

    if "deposits and credits" in lower and "withdrawals" in lower:
        return "bank"

    return "unknown"

#row extraction

def extract_transaction_rows(pdf_path: str):
    rows = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()

            #groups words by the y position
            lines = {}
            for w in words:
                top = round(w["top"], 1)
                lines.setdefault(top, []).append(w)

            for y in sorted(lines.keys()):
                line_words = sorted(lines[y], key=lambda x: x["x0"])
                line_text = " ".join(w["text"] for w in line_words)
                rows.append(line_text.strip())

    return rows

#stuff

def process_transactions(pdf_path: str):
    rows = extract_transaction_rows(pdf_path)

    raw_text = "\n".join(rows)
    statement_end_year = extract_statement_end_year(raw_text)
    account_type = detect_account_type(raw_text)

    items = []

    for line in rows:
        if not re.search(r"\d{1,2}[/-]\d{1,2}", line):
            continue

        if not re.search(r"\(?-?\$?[\d,]+\.\d{2}\)?", line):
            continue

        tokens = line.split()

        date_idx = None
        for i, t in enumerate(tokens):
            if is_date_mmdd(t):
                date_idx = i
                break
        if date_idx is None:
            continue

        amt_idx = None
        for i in range(len(tokens) - 1, -1, -1):
            if is_amount(tokens[i]):
                amt_idx = i
                break
        if amt_idx is None or amt_idx <= date_idx:
            continue

        trans_date = tokens[date_idx].replace("-", "/")

        desc_tokens = tokens[date_idx + 1: amt_idx]
        if desc_tokens and is_date_mmdd(desc_tokens[0]):
            desc_tokens = desc_tokens[1:]

        description = " ".join(desc_tokens).strip()
        if not description:
            continue

        amount_raw = clean_amount(tokens[amt_idx])

        if account_type == "credit_card":
            expense_type = "deposit" if amount_raw < 0 else "expense"
        else:
            expense_type = "deposit" if amount_raw > 0 else "expense"

        amount = abs(amount_raw)

        mm, dd = map(int, trans_date.split("/"))
        year = infer_year_for_mmdd(mm, statement_end_year, raw_text)
        purchase_date = f"{year}-{mm:02d}-{dd:02d}"

        items.append({
            "name": " ".join(description.lower().split()),
            "description": description,
            "amount": amount,
            "expense_type": expense_type,
            "purchase_date": purchase_date
        })

    print("DEBUG detected account_type:", account_type)
    print("DEBUG transaction count:", len(items))
    return items

#adds category to expenses

def get_default_cat(user_id: str):
    user_obj_id = ObjectId(user_id)

    cat = categories.find_one({"user_id": user_obj_id, "is_active": True})
    if cat:
        return str(cat["_id"])

    new_cat = {
        "user_id": user_obj_id,
        "name": "general",
        "category_id": next_counter(f"category_{user_id}", start=0),
        "description": "Auto-created default category",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }

    result = categories.insert_one(new_cat)
    return str(result.inserted_id)

def place_category(user_id: str, items: list):
    place_default_categories(user_id)

    categorized_items = []

    for i in items:
        category_name = ml_predict_expense_category(
            description=i["description"],
            name=i["name"]
        )

        cat = get_category_by_name(user_id, category_name)

        if not cat:
            cat_id = get_default_cat(user_id)
        else:
            cat_id = str(cat["_id"])

        categorized_items.append({
            "name": i["name"],
            "amount": i["amount"],
            "expense_type": i["expense_type"],
            "purchase_date": i["purchase_date"],
            "description": i["description"],
            "category_ref": cat_id
        })

    print("ML:", category_name)
    print("FOUND:", cat)

    return categorized_items

def process_bank_statement(user_id: str, pdf_path: str, file_name: str, description: str = ""):
    rows = extract_transaction_rows(pdf_path)
    raw_text = "\n".join(rows)
    account_type = detect_account_type(raw_text)

    doc = create_document(user_id=user_id, file_name=file_name, description=description, file_type="pdf")
    doc_ref = doc["_id"]

    documents.update_one(
        {"_id": ObjectId(doc_ref), "user_id": ObjectId(user_id), "is_active": True},
        {"$set": {"account_type": account_type, "updated_at": datetime.now(timezone.utc)}}
    )

    transactions = process_transactions(pdf_path)

    items = place_category(user_id, transactions)
    result = add_expense_to_document(user_id, doc_ref, items)

    return {
        "document": {**doc, "account_type": account_type},
        "processed_text_count": len(transactions),
        "insert_result": result
    }
