"""Proposal repository for database operations."""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.repositories.base import BaseRepository
from app.models.proposal import Proposal


class ProposalRepository(BaseRepository[Proposal]):
    """Repository for Proposal model operations."""

    def __init__(self, db: Session):
        super().__init__(Proposal, db)

    def get_by_period(
        self,
        period_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Proposal]:
        """Get proposals by period."""
        return (
            self.db.query(Proposal)
            .filter(Proposal.period_id == period_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(
        self,
        user_id: int,
        as_recipient: bool = False,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Proposal]:
        """Get proposals by user (as proposer or recipient)."""
        if as_recipient:
            query = self.db.query(Proposal).filter(
                Proposal.proposed_to_user_id == user_id
            )
        else:
            query = self.db.query(Proposal).filter(
                Proposal.proposed_by_user_id == user_id
            )

        if status:
            query = query.filter(Proposal.status == status)

        return query.order_by(Proposal.created_at.desc()).offset(skip).limit(limit).all()

    def get_pending_for_user(self, user_id: int) -> List[Proposal]:
        """Get pending proposals for a user to respond to."""
        return (
            self.db.query(Proposal)
            .filter(
                and_(
                    Proposal.proposed_to_user_id == user_id,
                    Proposal.status == "proposed",
                )
            )
            .order_by(Proposal.created_at.desc())
            .all()
        )

    def count_by_status(self, status: str) -> int:
        """Count proposals by status."""
        return self.db.query(Proposal).filter(Proposal.status == status).count()

    def delete_all_proposals(self) -> int:
        """Delete all proposals. Returns count of deleted proposals."""
        count = self.db.query(Proposal).count()
        self.db.query(Proposal).delete()
        self.db.commit()
        return count
