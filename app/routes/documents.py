import os
import tempfile

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from bson import ObjectId

from app.pdf.pdf_processing import process_bank_statement
from app.models.document import delete_document
from app.models.expense_entry import detect_and_flag_recurring
from app.services.expense_service import delete_customer_expense_entry
from app.db.db_connection import get_database
from app.routes.serializers import serialize
from app.routes.dependencies import require_owner

router = APIRouter(prefix="/documents", tags=["documents"])

db = get_database()
documents_col = db["document"]


@router.post("/{user_id}")
async def upload_document(
    user_id: str,
    file: UploadFile = File(...),
    description: str = Form(""),
    _: str = Depends(require_owner),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    tmp_path = None
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        result = process_bank_statement(
            user_id=user_id,
            pdf_path=tmp_path,
            file_name=file.filename,
            description=description,
        )
        detect_and_flag_recurring(user_id)
        return serialize(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/{user_id}")
def get_documents(user_id: str, _: str = Depends(require_owner)):
    try:
        docs = list(
            documents_col.find(
                {"user_id": ObjectId(user_id), "is_active": True}
            ).sort("created_at", -1)
        )
        return serialize(docs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}/{document_id}")
def remove_document(user_id: str, document_id: int, _: str = Depends(require_owner)):
    try:
        from bson import ObjectId
        doc = documents_col.find_one({
            "user_id": ObjectId(user_id),
            "document_id": document_id,
            "is_active": True,
        })
        if not doc:
            raise ValueError("Document not found")

        for expense_id in doc.get("linked_expense_ids", []):
            try:
                delete_customer_expense_entry(user_id, expense_id)
            except ValueError:
                pass

        deleted = delete_document(user_id, document_id)
        return {"deleted": deleted}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
