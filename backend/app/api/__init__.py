"""API Routes - Thin HTTP handlers."""

from fastapi import APIRouter

from app.api.routes_auth import router as auth_router
from app.api.routes_cards import router as cards_router
from app.api.routes_proposals import router as proposals_router
from app.api.routes_periods import router as periods_router
from app.api.routes_credits import router as credits_router
from app.api.routes_admin import router as admin_router
from app.api.routes_tags import router as tags_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(cards_router, prefix="/cards", tags=["cards"])
api_router.include_router(tags_router, prefix="/tags", tags=["tags"])
api_router.include_router(proposals_router, prefix="/proposals", tags=["proposals"])
api_router.include_router(periods_router, prefix="/periods", tags=["periods"])
api_router.include_router(credits_router, prefix="/credits", tags=["credits"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
