"""User model - Partner A and Partner B."""

from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    preference_votes: Mapped[list["PreferenceVote"]] = relationship(
        "PreferenceVote", back_populates="user"
    )
    proposals_made: Mapped[list["Proposal"]] = relationship(
        "Proposal",
        foreign_keys="Proposal.proposed_by_user_id",
        back_populates="proposed_by",
    )
    proposals_received: Mapped[list["Proposal"]] = relationship(
        "Proposal",
        foreign_keys="Proposal.proposed_to_user_id",
        back_populates="proposed_to",
    )
    credit_balance: Mapped["CreditBalance"] = relationship(
        "CreditBalance", back_populates="user", uselist=False
    )
    credit_ledger: Mapped[list["CreditLedger"]] = relationship(
        "CreditLedger", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}')>"
