from fastapi import APIRouter, HTTPException, Depends

from app.models.expense_entry import display_recurring_entries
from app.routes.serializers import serialize
from app.routes.dependencies import require_owner

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.get("/{user_id}")
def get_recurring(user_id: str, _: str = Depends(require_owner)):
    try:
        results = display_recurring_entries(user_id)
        return serialize(results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
