from app.db.db_connection import get_database

db = get_database()
users = db["users"]


def get_user_id(username: str):
    user = users.find_one({"username": username}, {"_id": 1})

    if user is None:
        return None

    return user["_id"]

def get_user_contact(username: str):
    user = users.find_one({"username": username},{"first_name": 1,"last_name": 1, "phone_num": 1, "email": 1})

    if user is None:
        return None

    return {"User Contact":{"First Name": user.get("first_name"),
                       "Last Name": user.get("last_name"),
                       "Email": user.get("email"),
                       "Phone Number": user.get("phone_num")
                       }}

def delete_user(username: str):
    user = users.find_one({"username": username})
    if user is None:
        return None

    return users.delete_one({"username": username})

