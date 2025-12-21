"""Period repository for database operations."""

from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.period import Period


class PeriodRepository(BaseRepository[Period]):
    """Repository for Period model operations."""

    def __init__(self, db: Session):
        super().__init__(Period, db)

    def get_active(self) -> Optional[Period]:
        """Get the active period."""
        return (
            self.db.query(Period)
            .filter(Period.status == "active")
            .first()
        )

    def get_by_status(
        self,
        status: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Period]:
        """Get periods by status."""
        return (
            self.db.query(Period)
            .filter(Period.status == status)
            .order_by(Period.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def deactivate_all(self) -> int:
        """Deactivate all active periods. Returns count of deactivated periods."""
        count = (
            self.db.query(Period)
            .filter(Period.status == "active")
            .update({"status": "done"})
        )
        self.db.commit()
        return count

    def activate(self, period_id: int) -> Optional[Period]:
        """Activate a period (deactivates others first)."""
        # Deactivate all active periods first
        self.deactivate_all()
        # Activate the specified period
        return self.update(period_id, {"status": "active"})
