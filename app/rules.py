import re
from pathlib import Path
from app.ml.keyword_loader import load_keywords

BASE_DIR = Path(__file__).resolve().parent
CATEGORY_KEYWORDS = load_keywords(BASE_DIR / "keywords")

CATEGORY_PRIORITY = [
    "finance",
    "subscriptions",
    "utilities",
    "groceries",
    "food",
    "transport",
    "travel",
    "healthcare",
    "entertainment",
    "shopping",
]

def tokenize(text):
    return set(re.findall(r"[a-z]+", str(text).lower()))

def normalize_text(text):
    text = str(text).lower()
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"[^\w\s]", " ", text)
    return text.strip()

def map_transaction(row):
    raw_text = f"{row.get('merchant','')} {row.get('description','')}"
    text = normalize_text(raw_text)
    tokens = tokenize(text)

    # ===== FINANCE =====
    if tokens & {"zelle", "venmo"}:
        return "finance"

    if "deposit" in tokens or "interest" in tokens:
        return "finance"

    # ===== SUBSCRIPTIONS =====
    if tokens & {
        "netflix", "spotify", "subscription", "recurring",
        "icloud", "hulu", "disney", "peacock", "paramount"
    }:
        return "subscriptions"

    # ===== KEYWORDS =====
    for category in CATEGORY_PRIORITY:
        keywords = CATEGORY_KEYWORDS.get(category, [])

        for k in keywords:
            k_tokens = set(re.findall(r"[a-z]+", str(k).lower()))
            if k_tokens and k_tokens.issubset(tokens):
                return category

    return None