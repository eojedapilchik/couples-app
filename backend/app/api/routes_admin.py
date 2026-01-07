"""Admin routes - System administration endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.card import PreferenceVote
from app.models.proposal import Proposal
from app.api.admin_access import require_admin_access
from app.api.backoffice_dependencies import get_backoffice_user_optional
from app.models.backoffice_user import BackofficeUser

router = APIRouter()


class ResetResponse(BaseModel):
    message: str
    votes_deleted: int
    proposals_deleted: int


@router.post("/reset", response_model=ResetResponse)
def reset_all_data(
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Reset all votes and proposals. Admin only."""
    require_admin_access(db, user_id, backoffice_user)

    # Delete all preference votes
    votes_count = db.query(PreferenceVote).count()
    db.query(PreferenceVote).delete()

    # Delete all proposals
    proposals_count = db.query(Proposal).count()
    db.query(Proposal).delete()

    db.commit()

    return ResetResponse(
        message="Datos reseteados exitosamente",
        votes_deleted=votes_count,
        proposals_deleted=proposals_count,
    )
