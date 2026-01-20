"""Grouping models for card categorization."""

from datetime import datetime, timezone

from sqlalchemy import String, Text, Integer, DateTime, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


card_groupings = Table(
    "card_groupings",
    Base.metadata,
    Column("card_id", ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True),
    Column("grouping_id", ForeignKey("groupings.id", ondelete="CASCADE"), primary_key=True),
)


class Grouping(Base):
    __tablename__ = "groupings"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    cards: Mapped[list["Card"]] = relationship(
        "Card", secondary=card_groupings, back_populates="groupings"
    )

    def __repr__(self) -> str:
        return f"<Grouping(id={self.id}, slug='{self.slug}', name='{self.name}')>"
