# app/main.py
# Run from project root:
#   python -m app.main

from datetime import datetime
from bson import ObjectId

from app.db.db_connection import get_database

# user
from app.services.customer_service import(
    register_customer,
    login_customer,
    view_customer_details,
)

# category
from app.services.category_service import (
    create_new_category,
    update_category_info,
    delete_category_info,
    display_categories,
)

# document
from app.services.document_service import (
    create_new_document,
    add_new_expense_to_document,
    delete_user_document,
)

# expense
from app.services.expense_service import (
    generate_expense_entry,
    update_customer_expense_entry,
    delete_customer_expense_entry,
)

# pdf import
from app.pdf.pdf_processing import process_bank_statement

# model helpers for lookups/listing
from app.models.user import get_user_id
from app.models.document import delete_document  # only if you want raw fallback; not used below

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
    existing = categories_col.find_one(
        {"user_id": user_obj_id, "is_active": True},
        {"_id": 1}
    )
    if existing:
        return str(existing["_id"])

    created = create_new_category(
        user_id=user_id,
        category_name="general",
        description="Auto-created default category",
    )
    return created["category"]["_id"]


def resolve_document_ref(user_id: str, doc_input: str) -> str:
    """
    Accepts either:
      - document_id (int as string, e.g. '1')
      - Mongo _id (24-hex ObjectId string)
    Returns the Mongo _id string (document_ref used by add_new_expense_to_document).
    """
    user_obj_id = ObjectId(user_id)
    s = doc_input.strip()

    if s.isdigit():
        doc_id = int(s)
        doc = documents_col.find_one(
            {"user_id": user_obj_id, "document_id": doc_id, "is_active": True},
            {"_id": 1}
        )
        if not doc:
            raise ValueError(f"No active document found with document_id={doc_id}")
        return str(doc["_id"])

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
    docs = list(
        documents_col.find({"user_id": user_obj_id, "is_active": True})
        .sort("created_at", -1)
        .limit(limit)
    )
    if not docs:
        print("(none)")
        return []

    for d in docs:
        print({
            "document_id": d.get("document_id"),
            "_id": str(d.get("_id")),
            "file_name": d.get("file_name"),
            "account_type": d.get("account_type"),
            "parsed_status": d.get("parsed_status"),
            "created_at": d.get("created_at"),
        })
    return docs


def list_categories_for_user(user_id: str):
    result = display_categories(user_id)
    cats = result.get("categories", [])
    if not cats:
        print("(none)")
        return []

    for c in cats:
        print({
            "_id": str(c.get("_id")) if c.get("_id") else None,
            "category_id": c.get("category_id"),
            "name": c.get("name"),
            "description": c.get("description"),
            "created_at": c.get("created_at"),
        })
    return cats


def list_expenses_for_user(user_id: str, limit: int = 20):
    user_obj_id = ObjectId(user_id)
    exps = list(
        expenses_col.find({"user_id": user_obj_id, "is_active": True})
        .sort("created_at", -1)
        .limit(limit)
    )
    if not exps:
        print("(none)")
        return []

    for e in exps:
        print({
            "expense_id": e.get("expense_id"),
            "name": e.get("name"),
            "amount": e.get("amount"),
            "expense_type": e.get("expense_type"),
            "purchase_date": e.get("purchase_date"),
            "category_ref": str(e.get("category_ref")) if e.get("category_ref") else None,
            "document_ref": str(e.get("document_ref")) if e.get("document_ref") else None,
            "created_at": e.get("created_at"),
        })
    return exps


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

[7] Upload / Import statement PDF

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
[4] Add ONE manual item to a document
[5] Add MULTIPLE manual items to a document
[0] Back
""")


def print_expenses_menu():
    header("Expenses Menu")
    print("""
[1] Create standalone expense
[2] Update standalone expense
[3] Delete expense
[4] List my expenses (latest 20)
[0] Back
""")


def print_upload_menu():
    header("Upload Menu")
    print("""
[1] Import bank statement PDF (process + insert)
[2] List my documents
[0] Back
""")


# ----------------------------
# User actions
# ----------------------------
def action_register():
    header("Register User")
    username = prompt("username: ")
    password = prompt("password: ")
    first_name = prompt("first_name: ")
    last_name = prompt("last_name: ")
    email = prompt("email: ")
    phone_number = prompt("phone_number: ")
    address = prompt("address: ")
    zip_code = prompt("zip_code: ")

    result = register_customer(
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        address=address,
        zip_code=zip_code,
    )
    print("✅ Registered:", result)


def action_login() -> str | None:
    header("Login")
    username = prompt("username: ")
    password = prompt("password: ")

    result = login_customer(username, password)
    print("✅ Login success:", result)
    return result["user_name"]


def action_show_user(username: str):
    header("My User Info")
    result = view_customer_details(username)
    print(result)


# ----------------------------
# Category actions
# ----------------------------
def action_create_category(username: str):
    header("Create Category")
    user_id = require_user_id(username)
    name = prompt("category name: ")
    description = prompt("description (optional): ")

    result = create_new_category(user_id, name, description)
    print("✅ Created:", result)


def action_update_category(username: str):
    header("Update Category")
    user_id = require_user_id(username)
    category_id = prompt_int("category_id (int): ")
    name = prompt("new name: ")
    description = prompt("new description (optional): ")

    result = update_category_info(user_id, category_id, name, description)
    print("✅ Updated:", result)


def action_delete_category(username: str):
    header("Delete Category (soft)")
    user_id = require_user_id(username)
    category_id = prompt_int("category_id (int): ")

    result = delete_category_info(user_id, category_id)
    print("✅ Deleted:", result)


def action_list_categories(username: str):
    header("My Categories")
    user_id = require_user_id(username)
    list_categories_for_user(user_id)


# ----------------------------
# Document actions
# ----------------------------
def action_create_document(username: str):
    header("Create Document")
    user_id = require_user_id(username)
    file_name = prompt("file_name: ")
    description = prompt("description (optional): ")

    result = create_new_document(user_id, file_name, description, "pdf")
    print("✅ Created document:")
    print({
        "document_id": result["document"].get("document_id"),
        "_id": result["document"].get("_id"),
        "file_name": result["document"].get("file_name"),
    })


def action_delete_document(username: str):
    header("Delete Document (soft)")
    user_id = require_user_id(username)
    document_id = prompt_int("document_id (int): ")

    result = delete_user_document(user_id, document_id)
    print("✅ Deleted:", result)


def action_list_documents(username: str):
    header("My Documents (document_id + _id)")
    user_id = require_user_id(username)
    list_documents_for_user(user_id, limit=30)


def action_add_one_manual_item_to_document(username: str):
    header("Add ONE Manual Item To Document")
    user_id = require_user_id(username)

    doc_input = prompt("document_id OR document _id: ")
    document_ref = resolve_document_ref(user_id, doc_input)
    print("✅ Using document_ref (_id):", document_ref)

    default_cat_ref = ensure_default_category(user_id)
    print("Default category_ref:", default_cat_ref)

    name = prompt("name: ")
    amount = prompt_float("amount (example: 12.34): ")
    expense_type = prompt("expense_type (deposit/expense): ").strip().lower()
    description = prompt("description (optional): ")
    purchase_date = prompt("purchase_date (YYYY-MM-DD, blank = today): ").strip()
    category_ref = prompt("category_ref (blank = default): ").strip()

    if not category_ref:
        category_ref = default_cat_ref
    if not purchase_date:
        purchase_date = datetime.now().strftime("%Y-%m-%d")

    result = add_new_expense_to_document(
        user_id=user_id,
        document_ref=document_ref,
        name=name,
        amount=amount,
        category_ref=category_ref,
        description=description,
        purchase_date=purchase_date,
        expense_type=expense_type,
    )
    print("✅ Result:", result)


def action_add_multiple_manual_items_to_document(username: str):
    header("Add MULTIPLE Manual Items To Document")
    user_id = require_user_id(username)

    doc_input = prompt("document_id OR document _id: ")
    document_ref = resolve_document_ref(user_id, doc_input)
    print("✅ Using document_ref (_id):", document_ref)

    default_cat_ref = ensure_default_category(user_id)
    print("Default category_ref:", default_cat_ref)

    items_created = []

    while True:
        print("\n--- Add Item ---")
        name = prompt("name: ")
        amount = prompt_float("amount (example: 12.34): ")
        expense_type = prompt("expense_type (deposit/expense): ").strip().lower()
        description = prompt("description (optional): ")
        purchase_date = prompt("purchase_date (YYYY-MM-DD, blank = today): ").strip()
        category_ref = prompt("category_ref (blank = default): ").strip()

        if not category_ref:
            category_ref = default_cat_ref
        if not purchase_date:
            purchase_date = datetime.now().strftime("%Y-%m-%d")

        result = add_new_expense_to_document(
            user_id=user_id,
            document_ref=document_ref,
            name=name,
            amount=amount,
            category_ref=category_ref,
            description=description,
            purchase_date=purchase_date,
            expense_type=expense_type,
        )
        items_created.append(result)

        if not prompt_yes_no("Add another item?"):
            break

    print("✅ Finished.")
    for r in items_created:
        print(r)


# ----------------------------
# Expense actions
# ----------------------------
def action_create_expense(username: str):
    header("Create Standalone Expense")
    user_id = require_user_id(username)
    default_cat_ref = ensure_default_category(user_id)

    name = prompt("name: ")
    amount = prompt_float("amount (example: 12.34): ")
    category_ref = prompt(f"category_ref (blank = {default_cat_ref}): ").strip()
    description = prompt("description (optional): ")
    purchase_date = prompt("purchase_date (YYYY-MM-DD, blank = today): ").strip()
    expense_type = prompt("expense_type (deposit/expense): ").strip().lower()

    if not category_ref:
        category_ref = default_cat_ref
    if not purchase_date:
        purchase_date = datetime.now().strftime("%Y-%m-%d")

    result = generate_expense_entry(
        user_id=user_id,
        name=name,
        amount=amount,
        category_ref=category_ref,
        description=description,
        purchase_date=purchase_date,
        document_ref="",
        expense_type=expense_type,
    )
    print("✅ Created:", result)


def action_update_expense(username: str):
    header("Update Standalone Expense")
    user_id = require_user_id(username)
    default_cat_ref = ensure_default_category(user_id)

    expense_id = prompt_int("expense_id (int): ")
    name = prompt("name: ")
    amount = prompt_float("amount (example: 12.34): ")
    category_ref = prompt(f"category_ref (blank = {default_cat_ref}): ").strip()
    description = prompt("description (optional): ")
    purchase_date = prompt("purchase_date (YYYY-MM-DD, blank = today): ").strip()
    expense_type = prompt("expense_type (deposit/expense): ").strip().lower()

    if not category_ref:
        category_ref = default_cat_ref
    if not purchase_date:
        purchase_date = datetime.now().strftime("%Y-%m-%d")

    result = update_customer_expense_entry(
        user_id=user_id,
        category_ref=category_ref,
        amount=amount,
        expense_id=expense_id,
        name=name,
        purchase_date=purchase_date,
        description=description,
        expense_type=expense_type,
    )
    print("✅ Updated:", result)


def action_delete_expense(username: str):
    header("Delete Expense")
    user_id = require_user_id(username)
    expense_id = prompt_int("expense_id (int): ")

    result = delete_customer_expense_entry(user_id, expense_id)
    print("✅ Deleted:", result)


def action_list_expenses(username: str, limit: int = 20):
    header(f"My Expenses (latest {limit})")
    user_id = require_user_id(username)
    list_expenses_for_user(user_id, limit=limit)


# ----------------------------
# Upload actions
# ----------------------------
def action_import_statement_pdf(username: str):
    header("Import Bank Statement PDF (process + insert)")
    user_id = require_user_id(username)

    pdf_path = prompt("pdf_path (absolute path recommended): ")
    file_name = prompt("file_name (example: chase_feb.pdf): ")
    description = prompt("description (optional): ")

    result = process_bank_statement(user_id, pdf_path, file_name, description)

    doc = result["document"]
    print("✅ Imported statement into document:")
    print({
        "document_id": doc.get("document_id"),
        "_id": doc.get("_id"),
        "file_name": doc.get("file_name"),
        "account_type": doc.get("account_type"),
    })
    print("processed_text_count:", result["processed_text_count"])
    print("insert_result:", result["insert_result"])


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
        elif choice == "4":
            action_add_one_manual_item_to_document(username)
        elif choice == "5":
            action_add_multiple_manual_items_to_document(username)
        else:
            print("❌ Invalid option.")


def expenses_menu(username: str):
    while True:
        print_expenses_menu()
        choice = prompt("Choose an option: ")
        if choice == "0":
            return
        elif choice == "1":
            action_create_expense(username)
        elif choice == "2":
            action_update_expense(username)
        elif choice == "3":
            action_delete_expense(username)
        elif choice == "4":
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
