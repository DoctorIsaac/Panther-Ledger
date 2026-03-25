
def validate_password(password: str) -> None:
    if not password:
        raise ValueError("Password field cannot be empty")

    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError("Password field must be at least 5 characters")

    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError("Password field must be at most 15 characters")

def normalize_email(email: str) -> str:
    return (email or "").strip().lower()

def validate_email(email: str) -> None:
    email_normalized = normalize_email(email)

    if not re.fullmatch(EMAIL_REGEX, email_normalized):
        raise ValueError("Email field must match regular expression")

def normalize_phone_number(phone_number: str) -> str:
    return (phone_number or "").strip()

def validate_phone_number(phone_number: str) -> None:
    phone_number_normalized = normalize_phone_number(phone_number)

    if not re.fullmatch(PHONE_REGEX, phone_number_normalized):
        raise ValueError("Phone number must match regular expression")

def normalize_first_name(first_name: str) -> str:
    return (first_name or "").strip()

def normalize_last_name(last_name: str) -> str:
    return (last_name or "").strip()

#checks for numerical values in name
def validate_name(name: str)-> None:

    if not name:
        raise ValueError("Name cannot be empty")

    if not re.fullmatch(NAME_REGEX, name):
        raise ValueError("Name contains invalid characters")

def normalize_address(address: str) -> str:
    return (address or "").strip()

def validate_address(address: str) -> None:
    if not address:
        raise ValueError("Address field cannot be empty")

    if len(address) > ADDRESS_MAX_LENGTH:
        raise ValueError("Address field must be at most 100 characters")

def normalize_zip_code(zip_code: str) -> str:
    return (zip_code or "").strip()

def validate_zip_code(zip_code: str) -> None:
    if not zip_code:
        raise ValueError("Zip code field cannot be empty")

    if len(zip_code) != ZIP_LENGTH:
        raise ValueError("Zip code field must be 5 characters")

    if not re.fullmatch(ZIP_REGEX, zip_code):
        raise ValueError("Zip code contains invalid characters")

def register_customer(username:str , password: str, first_name: str, last_name: str, email: str, phone_number: str, address: str, zip_code: str):
    username_normalized = normalize_username(username)
    password_normalized = normalize_password(password)
    first_name_normalized = normalize_first_name(first_name)
    last_name_normalized = normalize_last_name(last_name)
    email_normalized = normalize_email(email)
    phone_number_normalized = normalize_phone_number(phone_number)
    address_normalized = normalize_address(address)
    zip_code_normalized = normalize_zip_code(zip_code)

    validate_username(username_normalized)
    validate_password(password_normalized)
    validate_name(first_name_normalized)
    validate_name(last_name_normalized)
    validate_email(email_normalized)
    validate_phone_number(phone_number_normalized)
    validate_address(address_normalized)
    validate_zip_code(zip_code_normalized)

    success = register_user(username_normalized,
                            password_normalized,
                            first_name_normalized,
                            last_name_normalized,
                            email_normalized,
                            phone_number_normalized,
                            address_normalized,
                            zip_code_normalized)

    if not success:
        raise ValueError("Username already exists")

    user_id = get_user_id(username_normalized)

    return {
        "message": "Successfully registered",
        "user_name": username_normalized,
        "user_id": user_id
    }

def delete_customer(username:str):
    username_normalized = normalize_username(username)
    validate_username(username_normalized)

    success = delete_user(username_normalized)

    if not success:
        raise ValueError("Username does not exist")

    return {
        "message": "Successfully deleted",
        "user_name": username_normalized,
    }

#work on this
def login_customer(username:str , password: str):
    username_normalized = normalize_username(username)
    password_normalized = normalize_password(password)

    validate_username(username_normalized)
    validate_password(password_normalized)

    success = login_user(username_normalized, password_normalized)

    if not success:
        raise ValueError("Login failed")

    user_id = get_user_id(username_normalized)

    return {
        "message": "Successfully logged in",
        "user_name": username_normalized,
        "user_id": user_id
    }

def view_customer_details(username:str):
    username_normalized = normalize_username(username)
    validate_username(username_normalized)

    user_id =get_user_id(username_normalized)

    if not user_id:
        raise ValueError("User does not exist")

    contact_info = get_user_contact(username_normalized)

    return {
        "user_name": username_normalized,
        "user_id": user_id,
        "contact_info": contact_info}

def update_customer_details(username:str, updates: dict):
    username_normalized = normalize_username(username)
    validate_username(username_normalized)

    user_id = get_user_id(username_normalized)
    if not user_id:
        raise ValueError("User does not exist")

    #Validation check

    if "first_name" in updates:
        name = normalize_first_name(updates["first_name"])
        validate_name(name)
        updates["first_name"] = name

    if "last_name" in updates:
        name = normalize_last_name(updates["last_name"])
        validate_name(name)
        updates["last_name"] = name

    if "email" in updates:
        email = normalize_email(updates["email"])
        validate_email(email)
        updates["email"] = email

    if "phone_number" in updates:
        phone_number = updates["phone_number"]
        validate_phone_number(phone_number)
        updates["phone_number"] = phone_number

    if "address" in updates:
        address = normalize_address(updates["address"])
        validate_address(address)
        updates["address"] = address

    if "zip_code" in updates:
        zip_code = updates["zip_code"]
        validate_zip_code(zip_code)
        updates["zip_code"] = zip_code

    success = update_user_contact(username_normalized, updates)

    if not success:
        raise ValueError("Update failed")

    return {
        "user_name": username_normalized,
        "user_id": user_id,
        "contact_info": list(updates.keys())
    }




