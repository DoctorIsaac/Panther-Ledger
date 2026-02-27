# app/main.py
# Run from project root:
#   python -m app.main

from datetime import datetime
from bson import ObjectId

from app.db.db_connection import get_database
from app.db.auth_service import register_user, login_user  # ✅ correct (db layer)
from app.models.user import get_user_id, get_user_contact  # ✅ correct (models layer)

from app.models.category import create_category, update_category, delete_category
from app.models.document import create_document, delete_document, add_expense_to_document
from app.pdf.pdf_processing import process_bank_statement

db = get_database()
users_col = db["users"]
categories_col = db["category"]
documents_col = db["document"]
expenses_col = db["expense_entry"]


# ----------------------------
# Helpers
# ----------------------------
def prompt(msg: str) -> str:
    return input(msg).strip()

def prompt_int(msg: str) -> int:
    while True:
        s = input(msg).strip()
        try:
            return int(s)
        except ValueError:
            print("❌ Enter a valid integer.")

def prompt_float(msg: str) -> float:
    while True:
        s = input(msg).strip()
        try:
            return float(s)
        except ValueError:
            print("❌ Enter a valid number (example: 12.34).")

def prompt_yes_no(msg: str) -> bool:
    return input(msg + " (y/n): ").strip().lower() in ("y", "yes")

def header(title: str):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def require_login(username: str | None) -> str:
    if not username:
        raise ValueError("Login first.")
    return username

def require_user_id(username: str) -> str:
    uid = get_user_id(username)
    if not uid:
        raise ValueError(f"User '{username}' not found. Register first.")
    return str(uid)

def ensure_default_category(user_id: str) -> str:
    user_obj_id = ObjectId(user_id)
    existing = categories_col.find_one({"user_id": user_obj_id, "is_active": True}, {"_id": 1})
    if existing:
        return str(existing["_id"])
    cat = create_category(user_id=user_id, name="general", description="Auto-created default category")
    return cat["_id"]

def resolve_document_ref(user_id: str, doc_input: str) -> str:
    """
    Accepts either:
      - document_id (int as string, e.g. '1')
      - Mongo _id (24-hex ObjectId string)
    Returns the Mongo _id string (document_ref used by add_expense_to_document).
    """
    user_obj_id = ObjectId(user_id)
    s = doc_input.strip()

    # If numeric, treat as document_id
    if s.isdigit():
        doc_id = int(s)
        doc = documents_col.find_one(
            {"user_id": user_obj_id, "document_id": doc_id, "is_active": True},
            {"_id": 1}
        )
        if not doc:
            raise ValueError(f"No active document found with document_id={doc_id}")
        return str(doc["_id"])

    # Else treat as ObjectId
    try:
        oid = ObjectId(s)
    except Exception:
        raise ValueError("Enter a document_id (like 1) OR a valid ObjectId (24 hex chars).")

    doc = documents_col.find_one(
        {"_id": oid, "user_id": user_obj_id, "is_active": True},
        {"_id": 1}
    )
    if not doc:
        raise ValueError("Document not found for this user.")
    return str(doc["_id"])

def list_documents_for_user(user_id: str, limit: int = 20):
    user_obj_id = ObjectId(user_id)
    docs = list(documents_col.find({"user_id": user_obj_id, "is_active": True}).sort("created_at", -1).limit(limit))
    if not docs:
        print("(none)")
        return []
    for d in docs:
        print({
            "document_id": d.get("document_id"),
            "_id": str(d.get("_id")),
            "file_name": d.get("file_name"),
            "parsed_status": d.get("parsed_status"),
            "created_at": d.get("created_at"),
        })
    return docs


# ----------------------------
# Menus
# ----------------------------
def print_main_menu(logged_in_user: str | None):
    header("Finance Tracker - Main Menu")
    print("Logged in as:", logged_in_user if logged_in_user else "(none)")
    print("""
[1] Register user
[2] Login user
[3] Show my user_id + contact

[4] Categories menu
[5] Documents menu
[6] Expenses menu

[7] Upload / Import statement PDF  (goes to Upload Menu)

[0] Exit
""")

def print_categories_menu():
    header("Categories Menu")
    print("""
[1] Create category
[2] Update category
[3] Delete category (soft)
[4] List my categories
[0] Back
""")

def print_documents_menu():
    header("Documents Menu")
    print("""
[1] Create document
[2] Delete document (soft)
[3] List my documents (shows document_id + _id)
[0] Back
""")

def print_expenses_menu():
    header("Expenses Menu")
    print("""
[1] Add manual deposit/expense items to a document (accepts document_id OR _id)
[2] List my expenses (latest 20)
[0] Back
""")

def print_upload_menu():
    header("Upload Menu")
    print("""
[1] Import bank statement PDF (process + insert)
[2] List my documents (so you can see new document_id after upload)
[0] Back
""")


# ----------------------------
# Actions
# ----------------------------
def action_register():
    header("Register User")
    username = prompt("username: ")
    password = prompt("password: ")
    first_name = prompt("first_name: ")
    last_name = prompt("last_name: ")
    email = prompt("email: ")
    phone_num = prompt("phone_num: ")
    address = prompt("address: ")
    zip_code = prompt("zip_code: ")

    ok = register_user(username, password, first_name, last_name, email, phone_num, address, zip_code)
    print("✅ Registered." if ok else "❌ Username already exists.")

def action_login() -> str | None:
    header("Login")
    username = prompt("username: ")
    password = prompt("password: ")

    ok = login_user(username, password)
    if not ok:
        print("❌ Login failed.")
        return None

    print("✅ Login success.")
    return username

def action_show_user(username: str):
    header("My User Info")
    user_id = require_user_id(username)
    contact = get_user_contact(username)
    print("user_id:", user_id)
    print("contact:", contact)

def action_create_category(username: str):
    header("Create Category")
    user_id = require_user_id(username)
    name = prompt("category name: ")
    description = prompt("description (optional): ")
    cat = create_category(user_id, name, description)
    print("✅ Created:", cat)

def action_update_category(username: str):
    header("Update Category")
    user_id = require_user_id(username)
    category_id = prompt_int("category_id (int): ")
    name = prompt("new name: ")
    description = prompt("new description (optional): ")
    ok = update_category(user_id, category_id, name, description)
    print("✅ Updated." if ok else "⚠️ No changes made.")

def action_delete_category(username: str):
    header("Delete Category (soft)")
    user_id = require_user_id(username)
    category_id = prompt_int("category_id (int): ")
    ok = delete_category(user_id, category_id)
    print("✅ Deleted." if ok else "❌ Not deleted.")

def action_list_categories(username: str):
    header("My Categories")
    user_id = require_user_id(username)
    user_obj_id = ObjectId(user_id)

    cats = list(categories_col.find({"user_id": user_obj_id, "is_active": True}).sort("created_at", -1))
    if not cats:
        print("(none)")
        return

    for c in cats:
        print({
            "_id": str(c.get("_id")),
            "category_id": c.get("category_id"),
            "name": c.get("name"),
            "description": c.get("description"),
            "created_at": c.get("created_at"),
        })

def action_create_document(username: str):
    header("Create Document")
    user_id = require_user_id(username)
    file_name = prompt("file_name: ")
    description = prompt("description (optional): ")
    doc = create_document(user_id, file_name, description, "pdf")

    # ✅ Show BOTH ids so user can immediately add stuff to it
    print("✅ Created document:")
    print({
        "document_id": doc.get("document_id"),
        "_id": doc.get("_id"),
        "file_name": doc.get("file_name"),
    })

def action_delete_document(username: str):
    header("Delete Document (soft)")
    user_id = require_user_id(username)
    document_id = prompt_int("document_id (int): ")
    ok = delete_document(user_id, document_id)
    print("✅ Deleted." if ok else "❌ Not deleted.")

def action_list_documents(username: str):
    header("My Documents (document_id + _id)")
    user_id = require_user_id(username)
    list_documents_for_user(user_id, limit=30)

def action_add_manual_items(username: str):
    header("Add Manual Items to Document")
    user_id = require_user_id(username)

    # ✅ user can type document_id like "1" OR paste ObjectId
    doc_input = prompt("document_id OR document _id: ")
    document_ref = resolve_document_ref(user_id, doc_input)
    print("✅ Using document_ref (_id):", document_ref)

    default_cat_ref = ensure_default_category(user_id)
    print("Default category_ref:", default_cat_ref)

    default_purchase_date = prompt("default_purchase_date (MM-DD-YYYY, blank = today): ")
    if default_purchase_date == "":
        default_purchase_date = datetime.now().strftime("%m-%d-%Y")

    items = []
    while True:
        print("\n--- Add Item ---")
        name = prompt("name: ")
        description = prompt("description (optional): ")

        expense_type = prompt("expense_type (deposit/expense): ").lower()
        if expense_type not in ("deposit", "expense"):
            print("❌ expense_type must be 'deposit' or 'expense'")
            continue

        amount = prompt_float("amount (example: 12.34): ")

        # ✅ Normalize sign to match meaning
        if expense_type == "deposit":
            amount = abs(amount)
        else:
            amount = -abs(amount)

        purchase_date = prompt(f"purchase_date (MM-DD-YYYY, blank uses {default_purchase_date}): ")
        if purchase_date == "":
            purchase_date = default_purchase_date

        category_ref = prompt("category_ref (blank = default): ")
        if category_ref == "":
            category_ref = default_cat_ref

        items.append({
            "name": name,
            "amount": amount,
            "expense_type": expense_type,
            "purchase_date": purchase_date,
            "description": description,
            "category_ref": category_ref,
        })

        if not prompt_yes_no("Add another item?"):
            break

    result = add_expense_to_document(user_id, document_ref, items, default_purchase_date=default_purchase_date)
    print("✅ Result:", result)

def action_list_expenses(username: str, limit: int = 20):
    header(f"My Expenses (latest {limit})")
    user_id = require_user_id(username)
    user_obj_id = ObjectId(user_id)

    exps = list(expenses_col.find({"user_id": user_obj_id, "is_active": True}).sort("created_at", -1).limit(limit))
    if not exps:
        print("(none)")
        return

    for e in exps:
        print({
            "expense_id": e.get("expense_id"),
            "name": e.get("name"),
            "amount": e.get("amount"),
            "expense_type": e.get("expense_type"),
            "purchase_date": e.get("purchase_date"),
            "document_ref": str(e.get("document_ref")) if e.get("document_ref") else None,
        })

def action_import_statement_pdf(username: str):
    header("Import Bank Statement PDF (process + insert)")
    user_id = require_user_id(username)

    pdf_path = prompt("pdf_path (absolute path recommended): ")
    file_name = prompt("file_name (example: chase_feb.pdf): ")
    description = prompt("description (optional): ")

    res = process_bank_statement(user_id, pdf_path, file_name, description)

    # ✅ Print the new document ids so user can immediately add more items to it
    doc = res["document"]
    print("✅ Imported statement into document:")
    print({
        "document_id": doc.get("document_id"),
        "_id": doc.get("_id"),
        "file_name": doc.get("file_name"),
    })
    print("processed_text_count:", res["processed_text_count"])
    print("insert_result:", res["insert_result"])


# ----------------------------
# Submenu loops
# ----------------------------
def categories_menu(username: str):
    while True:
        print_categories_menu()
        choice = prompt("Choose an option: ")
        if choice == "0":
            return
        elif choice == "1":
            action_create_category(username)
        elif choice == "2":
            action_update_category(username)
        elif choice == "3":
            action_delete_category(username)
        elif choice == "4":
            action_list_categories(username)
        else:
            print("❌ Invalid option.")

def documents_menu(username: str):
    while True:
        print_documents_menu()
        choice = prompt("Choose an option: ")
        if choice == "0":
            return
        elif choice == "1":
            action_create_document(username)
        elif choice == "2":
            action_delete_document(username)
        elif choice == "3":
            action_list_documents(username)
        else:
            print("❌ Invalid option.")

def expenses_menu(username: str):
    while True:
        print_expenses_menu()
        choice = prompt("Choose an option: ")
        if choice == "0":
            return
        elif choice == "1":
            action_add_manual_items(username)
        elif choice == "2":
            action_list_expenses(username)
        else:
            print("❌ Invalid option.")

def upload_menu(username: str):
    while True:
        print_upload_menu()
        choice = prompt("Choose an option: ")
        if choice == "0":
            return
        elif choice == "1":
            action_import_statement_pdf(username)
        elif choice == "2":
            action_list_documents(username)
        else:
            print("❌ Invalid option.")


# ----------------------------
# Main loop
# ----------------------------
def main():
    logged_in_user = None

    while True:
        print_main_menu(logged_in_user)
        choice = prompt("Choose an option: ")

        try:
            if choice == "0":
                print("Bye.")
                break

            elif choice == "1":
                action_register()

            elif choice == "2":
                u = action_login()
                if u:
                    logged_in_user = u

            elif choice == "3":
                require_login(logged_in_user)
                action_show_user(logged_in_user)

            elif choice == "4":
                require_login(logged_in_user)
                categories_menu(logged_in_user)

            elif choice == "5":
                require_login(logged_in_user)
                documents_menu(logged_in_user)

            elif choice == "6":
                require_login(logged_in_user)
                expenses_menu(logged_in_user)

            elif choice == "7":
                require_login(logged_in_user)
                upload_menu(logged_in_user)

            else:
                print("❌ Invalid option.")

        except Exception as e:
            print("❌ ERROR:", e)


if __name__ == "__main__":
    main()
