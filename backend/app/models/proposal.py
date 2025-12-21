"""Proposal model - Weekly dares/card proposals."""

from datetime import datetime
from enum import Enum
from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProposalStatus(str, Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    MAYBE_LATER = "maybe_later"
    REJECTED = "rejected"
    COMPLETED_PENDING = "completed_pending_confirmation"
    COMPLETED_CONFIRMED = "completed_confirmed"
    EXPIRED = "expired"


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[int] = mapped_column(primary_key=True)
    period_id: Mapped[int] = mapped_column(ForeignKey("periods.id"), nullable=False)
    week_index: Mapped[int] = mapped_column(Integer, default=1)  # Week number in period
    proposed_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    proposed_to_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    # Card-based proposal (optional now)
    card_id: Mapped[int | None] = mapped_column(ForeignKey("cards.id"), nullable=True)

    # Custom reto fields (when card_id is None)
    custom_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    custom_description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Credit cost - set by recipient when accepting (max 7)
    credit_cost: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[ProposalStatus] = mapped_column(
        SQLEnum(ProposalStatus), default=ProposalStatus.PROPOSED
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    completed_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    period: Mapped["Period"] = relationship("Period", back_populates="proposals")
    proposed_by: Mapped["User"] = relationship(
        "User", foreign_keys=[proposed_by_user_id], back_populates="proposals_made"
    )
    proposed_to: Mapped["User"] = relationship(
        "User", foreign_keys=[proposed_to_user_id], back_populates="proposals_received"
    )
    card: Mapped["Card"] = relationship("Card", back_populates="proposals")
    credit_ledger_entries: Mapped[list["CreditLedger"]] = relationship(
        "CreditLedger", back_populates="proposal"
    )

    @property
    def title(self) -> str:
        """Get title from card or custom title."""
        if self.card:
            return self.card.title
        return self.custom_title or "Reto personalizado"

    @property
    def description(self) -> str | None:
        """Get description from card or custom description."""
        if self.card:
            return self.card.description
        return self.custom_description

    def __repr__(self) -> str:
        return f"<Proposal(id={self.id}, card_id={self.card_id}, custom_title={self.custom_title}, status={self.status})>"
