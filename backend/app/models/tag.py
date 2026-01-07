"""Tag model for card tag metadata (display names, translations, etc.)."""

from datetime import datetime
from enum import Enum
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TagType(str, Enum):
    CATEGORY = "category"  # Main high-level filters (basics, sensual, fantasy, etc.)
    INTENSITY = "intensity"  # Separate axis (estandar, picante, muy_picante)
    SUBTAG = "subtag"  # Detail tags within categories


class Tag(Base):
    """
    Tag metadata table - lookup only.

    Cards store their tags in a JSON field (cards.tags).
    This table provides display names, ordering, and other metadata.
    """
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    name_es: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tag_type: Mapped[str] = mapped_column(String(30), nullable=False)  # category, intensity, subtag
    parent_slug: Mapped[str | None] = mapped_column(String(50), nullable=True)  # For subtags
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Tag(slug='{self.slug}', type='{self.tag_type}')>"
