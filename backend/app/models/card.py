"""Card and PreferenceVote models."""

from datetime import datetime
from enum import Enum
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CardSource(str, Enum):
    MANUAL = "manual"
    LLM = "llm"
    IMPORTED = "imported"


class CardStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class CardCategory(str, Enum):
    CALIENTES = "calientes"
    ROMANCE = "romance"
    RISAS = "risas"
    OTRAS = "otras"


class PreferenceType(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    NEUTRAL = "neutral"
    MAYBE = "maybe"  # "To please you" - middle option


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)  # JSON string
    category: Mapped[CardCategory] = mapped_column(
        SQLEnum(CardCategory), nullable=False
    )
    spice_level: Mapped[int] = mapped_column(Integer, default=1)  # 1-5
    difficulty_level: Mapped[int] = mapped_column(Integer, default=1)  # 1-5
    credit_value: Mapped[int] = mapped_column(Integer, default=3)  # 1-10
    source: Mapped[CardSource] = mapped_column(
        SQLEnum(CardSource), default=CardSource.MANUAL
    )
    status: Mapped[CardStatus] = mapped_column(
        SQLEnum(CardStatus), default=CardStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    preference_votes: Mapped[list["PreferenceVote"]] = relationship(
        "PreferenceVote", back_populates="card"
    )
    proposals: Mapped[list["Proposal"]] = relationship("Proposal", back_populates="card")

    def __repr__(self) -> str:
        return f"<Card(id={self.id}, title='{self.title}', category={self.category})>"


class PreferenceVote(Base):
    __tablename__ = "preference_votes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False)
    preference: Mapped[PreferenceType] = mapped_column(
        SQLEnum(PreferenceType), default=PreferenceType.NEUTRAL
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preference_votes")
    card: Mapped["Card"] = relationship("Card", back_populates="preference_votes")

    def __repr__(self) -> str:
        return f"<PreferenceVote(user_id={self.user_id}, card_id={self.card_id}, pref={self.preference})>"
