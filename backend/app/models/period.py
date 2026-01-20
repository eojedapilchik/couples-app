"""Period model - Game periods (week/month/2-month)."""

from datetime import datetime, date, timezone
from enum import Enum
from sqlalchemy import String, Integer, Date, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PeriodType(str, Enum):
    WEEK = "week"
    MONTH = "month"
    TWO_MONTH = "two_month"


class PeriodStatus(str, Enum):
    SETUP = "setup"
    ACTIVE = "active"
    DONE = "done"


class Period(Base):
    __tablename__ = "periods"

    id: Mapped[int] = mapped_column(primary_key=True)
    period_type: Mapped[PeriodType] = mapped_column(
        SQLEnum(PeriodType), nullable=False
    )
    status: Mapped[PeriodStatus] = mapped_column(
        SQLEnum(PeriodStatus), default=PeriodStatus.SETUP
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    weekly_base_credits: Mapped[int] = mapped_column(Integer, default=3)
    cards_to_play_per_week: Mapped[int] = mapped_column(Integer, default=3)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    proposals: Mapped[list["Proposal"]] = relationship(
        "Proposal", back_populates="period"
    )
    credit_ledger_entries: Mapped[list["CreditLedger"]] = relationship(
        "CreditLedger", back_populates="period"
    )

    def __repr__(self) -> str:
        return f"<Period(id={self.id}, type={self.period_type}, status={self.status})>"
