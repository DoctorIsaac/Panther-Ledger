from .db_connection import get_database
from .pass_util import  hash_password, verify_password


#Connect to Database
db = get_database()

users = db["users"]

def register_user(username, password, first_name, last_name, email, phone_num, address, zip_code):
    if users.find_one({"username": username}):
        return False

    users.insert_one({"username": username,
                     "password":hash_password(password),
                      "first_name": first_name,
                      "last_name": last_name,
                      "email": email,
                      "phone_num": phone_num,
                      "address": address,
                      "zip_code": zip_code
                      })
    return True

#User login
def login_user(username, password):
    user = users.find_one({"username": username})
    if not user:
        return False

    return verify_password(password, user["password"])





