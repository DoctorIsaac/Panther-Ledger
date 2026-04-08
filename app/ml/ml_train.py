from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.utils import resample
import joblib
import re
from app.ml.keyword_loader import load_keywords

BASE_DIR = Path(__file__).resolve(1).parent
CATEGORY_KEYWORDS = load_keywords(BASE_DIR / "keywords")

CORE_CATEGORIES = {
    "utilities", "transport", "groceries", "food", "subscriptions",
    "travel", "healthcare", "entertainment", "shopping", "finance", "general"
}

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

# ================= NORMALIZATION =================

def tokenize(text):
    return set(re.findall(r"[a-z]+", str(text).lower()))

def normalize_text(text):
    text = str(text).lower()
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"[^\w\s]", " ", text)  # KEEP SPACES
    return text.strip()

def simplify_category(cat):
    c = str(cat).lower()

    if "medical" in c or "health" in c or "dental" in c:
        return "healthcare"
    if "movie" in c or "tv" in c:
        return "entertainment"

    return c

# ================= RULE ENGINE =================

def map_transaction(row):
    raw_text = f"{row['merchant']} {row['description']}"
    text = normalize_text(raw_text)
    tokens = tokenize(text)

    # ===== FINANCE (STRICT) =====
    if tokens & {"zelle", "venmo"}:
        return "finance"

    if ("deposit" in tokens or "dividend" in tokens or "interest" in tokens):
        return "finance"

    # ===== SUBSCRIPTIONS =====
    if tokens & {
        "netflix", "spotify", "subscription", "recurring",
        "icloud", "hulu", "disney", "peacock", "paramount"
    }:
        return "subscriptions"

    # ===== KEYWORD MATCH =====
    for category in CATEGORY_PRIORITY:
        keywords = CATEGORY_KEYWORDS.get(category, [])

        for k in keywords:
            k_tokens = set(re.findall(r"[a-z]+", str(k).lower()))

            # ALL words in keyword must exist
            if k_tokens and k_tokens.issubset(tokens):
                return category

    return None

# ================= DATA =================

df1 = pd.read_csv(BASE_DIR / "personal_expense_classification.csv")
df2 = pd.read_csv(BASE_DIR / "finance-expense-categorization-dataset.csv")
df3 = pd.read_csv(BASE_DIR / "surgeAI_bank_transactions_dataset.csv")

df1_clean = df1[["merchant", "description", "category"]]

df2_clean = pd.DataFrame({
    "merchant": df2["merchant_name"],
    "description": df2["description"],
    "category": df2["category"]
})

df3_clean = pd.DataFrame({
    "merchant": df3["transaction_text"],
    "description": df3["transaction_description"],
    "category": df3["transaction_category"]
})

df = pd.concat([df1_clean, df2_clean, df3_clean], ignore_index=True)
# ================= APPLY RULES =================

df["mapped_category"] = df.apply(map_transaction, axis=1)

def clean_category(cat):
    c = str(cat).lower()
    parts = c.split("/")
    return parts[-1].strip()

df["final_category"] = df.apply(
    lambda row: row["mapped_category"]
    if row["mapped_category"] is not None and row["mapped_category"] in CORE_CATEGORIES
    else clean_category(row["category"]),
    axis=1
)

df["final_category"] = df["final_category"].apply(simplify_category)

df["final_category"] = df["final_category"].apply(
    lambda x: x if x in CORE_CATEGORIES else "other"
)
# ================= CLEAN RARE =================

counts = df["final_category"].value_counts()
rare = counts[counts < 5].index

df["final_category"] = df["final_category"].apply(
    lambda x: "other" if x in rare else x
)
# ================= TEXT =================

df["merchant"] = df["merchant"].fillna("").astype(str)
df["description"] = df["description"].fillna("").astype(str)
df["final_category"] = df["final_category"].fillna("").astype(str)

df["text"] = (
    df["merchant"] + " " + df["description"]
).apply(normalize_text)

# ================= BALANCE =================

target_size = 200
balanced = []

for cat, group in df.groupby("final_category"):
    if len(group) < target_size:
        balanced.append(resample(group, replace=True, n_samples=target_size, random_state=42))
    else:
        balanced.append(group.sample(target_size, random_state=42))

df = pd.concat(balanced).reset_index(drop=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)


X = df["text"]
Y = df["final_category"]

vectorizer = TfidfVectorizer(
    max_features=10000,
    ngram_range=(1, 2),
    stop_words="english"
)

X_vector = vectorizer.fit_transform(X)

model = LogisticRegression(
    max_iter=5000,
    class_weight="balanced"
)

model.fit(X_vector, Y)

joblib.dump(model, BASE_DIR / "model.pkl")
joblib.dump(vectorizer, BASE_DIR / "vectorizer.pkl")