"""Credit repository for database operations."""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.repositories.base import BaseRepository
from app.models.credit import CreditBalance, CreditLedger


class CreditBalanceRepository(BaseRepository[CreditBalance]):
    """Repository for CreditBalance model operations."""

    def __init__(self, db: Session):
        super().__init__(CreditBalance, db)

    def get_by_user(self, user_id: int) -> Optional[CreditBalance]:
        """Get credit balance for a user."""
        return (
            self.db.query(CreditBalance)
            .filter(CreditBalance.user_id == user_id)
            .first()
        )

    def get_or_create(self, user_id: int, initial_balance: int = 0) -> CreditBalance:
        """Get or create credit balance for a user."""
        balance = self.get_by_user(user_id)
        if balance:
            return balance
        return self.create({"user_id": user_id, "balance": initial_balance})

    def update_balance(self, user_id: int, amount: int) -> Optional[CreditBalance]:
        """Add or subtract from user's balance."""
        balance = self.get_by_user(user_id)
        if balance:
            balance.balance += amount
            self.db.commit()
            self.db.refresh(balance)
            return balance
        return None

    def set_balance(self, user_id: int, amount: int) -> Optional[CreditBalance]:
        """Set user's balance to a specific amount."""
        balance = self.get_by_user(user_id)
        if balance:
            balance.balance = amount
            self.db.commit()
            self.db.refresh(balance)
            return balance
        return None


class CreditLedgerRepository(BaseRepository[CreditLedger]):
    """Repository for CreditLedger model operations."""

    def __init__(self, db: Session):
        super().__init__(CreditLedger, db)

    def get_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CreditLedger]:
        """Get ledger entries for a user."""
        return (
            self.db.query(CreditLedger)
            .filter(CreditLedger.user_id == user_id)
            .order_by(CreditLedger.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_period(
        self,
        period_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CreditLedger]:
        """Get ledger entries for a period."""
        return (
            self.db.query(CreditLedger)
            .filter(CreditLedger.period_id == period_id)
            .order_by(CreditLedger.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_proposal(self, proposal_id: int) -> List[CreditLedger]:
        """Get ledger entries for a proposal."""
        return (
            self.db.query(CreditLedger)
            .filter(CreditLedger.proposal_id == proposal_id)
            .all()
        )

    def sum_by_user(self, user_id: int) -> int:
        """Calculate total balance from ledger for a user."""
        result = (
            self.db.query(func.sum(CreditLedger.amount))
            .filter(CreditLedger.user_id == user_id)
            .scalar()
        )
        return result or 0

    def add_entry(
        self,
        user_id: int,
        ledger_type: str,
        amount: int,
        period_id: Optional[int] = None,
        proposal_id: Optional[int] = None,
        note: Optional[str] = None,
    ) -> CreditLedger:
        """Add a new ledger entry."""
        return self.create({
            "user_id": user_id,
            "type": ledger_type,
            "amount": amount,
            "period_id": period_id,
            "proposal_id": proposal_id,
            "note": note,
        })


class CreditRepository:
    """Combined repository for credit operations."""

    def __init__(self, db: Session):
        self.balance = CreditBalanceRepository(db)
        self.ledger = CreditLedgerRepository(db)
        self.db = db
