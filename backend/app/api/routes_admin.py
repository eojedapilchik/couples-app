"""Admin routes - System administration endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.card import PreferenceVote
from app.models.proposal import Proposal

router = APIRouter()


class ResetResponse(BaseModel):
    message: str
    votes_deleted: int
    proposals_deleted: int


@router.post("/reset", response_model=ResetResponse)
def reset_all_data(user_id: int, db: Session = Depends(get_db)):
    """Reset all votes and proposals. Admin only."""
    # Check if user is admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden hacer esto")

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
