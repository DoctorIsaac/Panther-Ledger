from app.db.db_connection import get_database
db = get_database()
users = db["users"]


def get_user_id(username: str):
    user = users.find_one({"username": username}, {"_id": 1})

    if user is None:
        return None

    return str(user["_id"])

def get_user_contact(username: str):
    user = users.find_one({"username": username},{"first_name": 1,"last_name": 1, "phone_number": 1, "email": 1})

    if user is None:
        return None

    return {"User Contact":{"First Name": user.get("first_name"),
                       "Last Name": user.get("last_name"),
                       "Email": user.get("email"),
                       "Phone Number": user.get("phone_number")
                       }}

#Updates user fields of allowed fields
def update_user_contact(username: str, updates: dict):
    ALLOWED_FIELDS = ["first_name", "last_name", "email", "phone_number", "zip_code"]

    updates = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}

    if not updates:
        raise ValueError("No valid fields to update")

    result = users.update_one(
        {"username": username},
        {"$set": updates})

    return result.matched_count == 1

def delete_user(username: str):
    user = users.find_one({"username": username})
    if user is None:
        return None

    return users.delete_one({"username": username}).deleted_count == 1

