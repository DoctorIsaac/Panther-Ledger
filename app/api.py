from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FinanceTracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.expenses import router as expenses_router
from app.routes.analytics import router as analytics_router
from app.routes.recurring import router as recurring_router

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(expenses_router)
app.include_router(analytics_router)
app.include_router(recurring_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
