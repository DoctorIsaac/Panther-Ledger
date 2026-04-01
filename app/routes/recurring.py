from fastapi import APIRouter, HTTPException

from app.models.expense_entry import display_recurring_entries
from app.routes.serializers import serialize

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.get("/{user_id}")
def get_recurring(user_id: str):
    try:
        results = display_recurring_entries(user_id)
        return serialize(results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
