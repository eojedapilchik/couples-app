"""Credit Service - Ledger is the source of truth."""

from sqlalchemy.orm import Session

from app.models.credit import CreditBalance, CreditLedger, LedgerType
from app.models.user import User


class CreditService:
    """All credit operations go through the ledger."""

    @staticmethod
    def get_balance(db: Session, user_id: int) -> int:
        """Get current balance for a user."""
        balance = db.query(CreditBalance).filter(
            CreditBalance.user_id == user_id
        ).first()
        return balance.balance if balance else 0

    @staticmethod
    def get_or_create_balance(db: Session, user_id: int) -> CreditBalance:
        """Get or create balance record for user."""
        balance = db.query(CreditBalance).filter(
            CreditBalance.user_id == user_id
        ).first()
        if not balance:
            balance = CreditBalance(user_id=user_id, balance=0)
            db.add(balance)
            db.commit()
            db.refresh(balance)
        return balance

    @staticmethod
    def add_ledger_entry(
        db: Session,
        user_id: int,
        ledger_type: LedgerType,
        amount: int,
        period_id: int | None = None,
        proposal_id: int | None = None,
        note: str | None = None,
    ) -> CreditLedger:
        """Add a ledger entry and update balance atomically."""
        # Create ledger entry
        entry = CreditLedger(
            user_id=user_id,
            period_id=period_id,
            proposal_id=proposal_id,
            type=ledger_type,
            amount=amount,
            note=note,
        )
        db.add(entry)

        # Update balance
        balance = CreditService.get_or_create_balance(db, user_id)
        balance.balance += amount

        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def grant_initial_credits(db: Session, user_id: int, amount: int = 10) -> CreditLedger:
        """Grant initial credits to a new user."""
        return CreditService.add_ledger_entry(
            db=db,
            user_id=user_id,
            ledger_type=LedgerType.INITIAL_GRANT,
            amount=amount,
            note="Creditos iniciales",
        )

    @staticmethod
    def grant_weekly_credits(
        db: Session, user_id: int, period_id: int, amount: int
    ) -> CreditLedger:
        """Grant weekly base credits."""
        return CreditService.add_ledger_entry(
            db=db,
            user_id=user_id,
            ledger_type=LedgerType.WEEKLY_BASE_GRANT,
            amount=amount,
            period_id=period_id,
            note="Creditos semanales",
        )

    @staticmethod
    def deduct_proposal_cost(
        db: Session, user_id: int, proposal_id: int, cost: int
    ) -> CreditLedger:
        """Deduct credits for making a proposal."""
        return CreditService.add_ledger_entry(
            db=db,
            user_id=user_id,
            ledger_type=LedgerType.PROPOSAL_COST,
            amount=-cost,  # Negative for deduction
            proposal_id=proposal_id,
            note="Costo de propuesta",
        )

    @staticmethod
    def award_completion_reward(
        db: Session, user_id: int, proposal_id: int, reward: int
    ) -> CreditLedger:
        """Award credits for completing a dare."""
        return CreditService.add_ledger_entry(
            db=db,
            user_id=user_id,
            ledger_type=LedgerType.COMPLETION_REWARD,
            amount=reward,
            proposal_id=proposal_id,
            note="Recompensa por completar reto",
        )

    @staticmethod
    def get_ledger(
        db: Session, user_id: int, limit: int = 50, offset: int = 0
    ) -> tuple[list[CreditLedger], int]:
        """Get ledger entries for a user."""
        query = db.query(CreditLedger).filter(CreditLedger.user_id == user_id)
        total = query.count()
        entries = query.order_by(CreditLedger.created_at.desc()).offset(offset).limit(limit).all()
        return entries, total

    @staticmethod
    def has_sufficient_credits(db: Session, user_id: int, amount: int) -> bool:
        """Check if user has enough credits."""
        return CreditService.get_balance(db, user_id) >= amount
