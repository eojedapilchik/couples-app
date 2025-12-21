"""Credit models - Balance and Ledger (source of truth)."""

from datetime import datetime
from enum import Enum
from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LedgerType(str, Enum):
    WEEKLY_BASE_GRANT = "weekly_base_grant"
    PROPOSAL_COST = "proposal_cost"
    COMPLETION_REWARD = "completion_reward"
    ADMIN_ADJUSTMENT = "admin_adjustment"
    INITIAL_GRANT = "initial_grant"


class CreditBalance(Base):
    """Current balance per user (convenience cache, ledger is source of truth)."""
    __tablename__ = "credit_balances"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    balance: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="credit_balance")

    def __repr__(self) -> str:
        return f"<CreditBalance(user_id={self.user_id}, balance={self.balance})>"


class CreditLedger(Base):
    """Immutable ledger of all credit transactions (source of truth)."""
    __tablename__ = "credit_ledger"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    period_id: Mapped[int | None] = mapped_column(
        ForeignKey("periods.id"), nullable=True
    )
    proposal_id: Mapped[int | None] = mapped_column(
        ForeignKey("proposals.id"), nullable=True
    )
    type: Mapped[LedgerType] = mapped_column(SQLEnum(LedgerType), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # + or -
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="credit_ledger")
    period: Mapped["Period"] = relationship(
        "Period", back_populates="credit_ledger_entries"
    )
    proposal: Mapped["Proposal"] = relationship(
        "Proposal", back_populates="credit_ledger_entries"
    )

    def __repr__(self) -> str:
        return f"<CreditLedger(id={self.id}, user_id={self.user_id}, type={self.type}, amount={self.amount})>"
