from bson import ObjectId, Decimal128
from datetime import datetime


def serialize(value):
    """Recursively convert MongoDB types to JSON-serializable Python types."""
    if isinstance(value, dict):
        return {k: serialize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, Decimal128):
        return float(value.to_decimal())
    if isinstance(value, datetime):
        return value.isoformat()
    return value
