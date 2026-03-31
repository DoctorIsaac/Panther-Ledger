from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from app.services.analytics_service import get_expenses_by_range

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/{user_id}")
def get_analytics(
    user_id: str,
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
):
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be in YYYY-MM-DD format")

    try:
        return get_expenses_by_range(user_id, start, end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
