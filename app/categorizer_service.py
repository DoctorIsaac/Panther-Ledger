from pathlib import Path
import joblib

DEBUG = False
BASE_DIR = Path(__file__).resolve().parent.parent / "ml"

model = joblib.load(BASE_DIR / "model.pkl")
vectorizer = joblib.load(BASE_DIR / "vectorizer.pkl")


def normalize_prediction(pred):
    p = pred.lower()

    if "grocery" in p:
        return "groceries"

    if any(x in p for x in ["food", "restaurant", "coffee", "drink"]):
        return "food"

    if any(x in p for x in ["uber", "transport", "taxi", "bus", "fuel", "gas"]):
        return "transport"

    if any(x in p for x in ["netflix", "spotify", "subscription", "stream"]):
        return "subscriptions"

    if any(x in p for x in ["bank", "payment", "credit", "transfer", "zelle", "venmo"]):
        return "finance"

    if any(x in p for x in ["movie", "tv"]):
        return "entertainment"

    return "general"


def ml_predict_expense_category(description: str, name: str = ""):
    text = f"{name} {description}".lower()

    # ===== STEP 1: RULE ENGINE =====
    try:
        from app.ml.rules import map_transaction

        fake_row = {
            "merchant": name,
            "description": description
        }

        rule_category = map_transaction(fake_row)

        if rule_category:
            return rule_category

    except Exception as e:
        if DEBUG:
            print("rule error:", e)

    # ===== STEP 2: ML =====
    vec = vectorizer.transform([text])
    probs = model.predict_proba(vec)[0]

    confidence = max(probs)
    predicted_class = model.classes_[probs.argmax()]

    category = normalize_prediction(predicted_class)

    if confidence < 0.15:
        return "general"

    return category