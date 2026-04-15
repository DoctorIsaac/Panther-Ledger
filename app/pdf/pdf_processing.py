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

# Patterns that match sensitive identifiers that should never be stored
_SENSITIVE_PATTERNS = [
    # 16-digit card numbers (with optional spaces or dashes)
    (re.compile(r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b'), '****'),
    # 9-digit standalone account numbers
    (re.compile(r'\b\d{9}\b'), '*********'),
    # SSN-style  123-45-6789
    (re.compile(r'\b\d{3}-\d{2}-\d{4}\b'), '***-**-****'),
    # "acct #123...", "account no. 456..."
    (re.compile(r'(?i)\bacct(?:ount)?\.?\s*(?:#|no\.?)?\s*\d+'), 'acct ****'),
]

def mask_sensitive_data(text: str) -> str:
    """Strip account/card numbers and other sensitive identifiers from text."""
    for pattern, replacement in _SENSITIVE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text

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

    # Check bank indicators FIRST.  Wells Fargo debit-card purchases include
    # the word "VISA" in their descriptions, so we must confirm it is not a
    # bank account before using "visa" as a credit-card signal.
    if "deposits/additions" in lower or "withdrawals/subtractions" in lower:
        return "bank"

    if "checking account" in lower or "savings account" in lower:
        return "bank"

    if "deposits and credits" in lower and "withdrawals" in lower:
        return "bank"

    # Credit-card-specific section headers
    if "purchases and adjustments" in lower:
        return "credit_card"

    if "payments and other credits" in lower:
        return "credit_card"

    # "visa" / "mastercard" / "amex" are reliable only when no bank signals
    # were found above.  A bare "visa" could still be a debit-card reference
    # on a bank statement, so require at least one of the stronger card words.
    if "mastercard" in lower or "american express" in lower:
        return "credit_card"

    if "visa" in lower and "withdrawals" not in lower:
        return "credit_card"

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

# Lines matching these patterns are running-balance summaries, not transactions
_BALANCE_ROW_RE = re.compile(
    r"(?i)\b(ending|beginning|opening|closing|daily|running)\s+(daily\s+)?balance\b"
    r"|\bbalance\s+(forward|brought\s+forward)\b"
    r"|\btotal\s+(withdrawals?|deposits?|debits?|credits?)\b"
)

# Description keywords that signal a deposit/credit on a bank account
_DEPOSIT_KEYWORDS_RE = re.compile(
    r"(?i)\b(deposit|direct\s+dep|payroll|transfer\s+in|transfer\s+from"
    r"|zelle\s+from|venmo|interest\s+paid|dividend|refund|reimburse"
    r"|credit|atm\s+deposit)\b"
)

#stuff

def process_transactions(pdf_path: str):
    rows = extract_transaction_rows(pdf_path)

    raw_text = "\n".join(rows)
    statement_end_year = extract_statement_end_year(raw_text)
    account_type = detect_account_type(raw_text)

    items = []

    for line in rows:
        # Skip balance summary rows (e.g. "Ending balance", "Beginning balance")
        if _BALANCE_ROW_RE.search(line):
            continue

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

        # Collect all amount token indices that appear after the date
        all_amt_indices = [i for i in range(date_idx + 1, len(tokens)) if is_amount(tokens[i])]

        if not all_amt_indices:
            continue

        # Bank statements (e.g. Wells Fargo) include a running balance as the
        # last column on every transaction row.  When two or more amounts are
        # present the last one is that running balance; the second-to-last is
        # the actual transaction amount.
        if account_type == "bank" and len(all_amt_indices) >= 2:
            amt_idx = all_amt_indices[-2]
        else:
            amt_idx = all_amt_indices[-1]

        trans_date = tokens[date_idx].replace("-", "/")

        desc_tokens = tokens[date_idx + 1: amt_idx]
        if desc_tokens and is_date_mmdd(desc_tokens[0]):
            desc_tokens = desc_tokens[1:]

        description = " ".join(desc_tokens).strip()
        if not description:
            continue

        amount_raw = clean_amount(tokens[amt_idx])
        amount = abs(amount_raw)

        if amount == 0:
            continue

        # Determine deposit vs. expense
        if account_type == "credit_card":
            # Credit card: negative amounts are payments/credits, positive are purchases
            expense_type = "deposit" if amount_raw < 0 else "expense"
        elif account_type == "bank":
            # Bank statements (e.g. Wells Fargo) don't use negative signs for
            # withdrawals — every amount is positive regardless of direction.
            # Use description keywords to identify deposits; anything else is
            # a withdrawal/expense.  This covers both rows that have a running
            # balance column (2+ amounts) and intermediate rows that only show
            # the transaction amount (1 amount).
            if _DEPOSIT_KEYWORDS_RE.search(description):
                expense_type = "deposit"
            else:
                expense_type = "expense"
        else:
            # Unknown account type: fall back to sign-based classification
            expense_type = "deposit" if amount_raw > 0 else "expense"

        mm, dd = map(int, trans_date.split("/"))
        year = infer_year_for_mmdd(mm, statement_end_year, raw_text)
        purchase_date = f"{year}-{mm:02d}-{dd:02d}"

        safe_description = mask_sensitive_data(description)
        items.append({
            "name": " ".join(safe_description.lower().split()),
            "description": safe_description,
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
