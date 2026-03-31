from .db_connection import get_database

db = get_database()
counters = db["counters"]


def next_counter(name: str, start: int = 0) -> int:
    result = counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )

    # On first insert, seq starts at 1. Adjust by (start - 1) so the
    # effective first value equals `start`.
    return result["seq"] + start - 1
