"""Tag schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field


class TagResponse(BaseModel):
    id: int
    slug: str
    name: str
    name_en: str | None = None
    name_es: str | None = None
    tag_type: str  # category, intensity, subtag
    parent_slug: str | None = None
    display_order: int

    model_config = {"from_attributes": True}


class TagsGroupedResponse(BaseModel):
    """Tags grouped by type for the filter UI."""
    categories: list[TagResponse]
    intensity: list[TagResponse]
    subtags: list[TagResponse] = []


class TagCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=100)
    name_en: str | None = Field(None, min_length=1, max_length=100)
    name_es: str | None = Field(None, min_length=1, max_length=100)
    tag_type: str = Field(..., min_length=1, max_length=30)
    parent_slug: str | None = None
    display_order: int = 0


class TagUpdate(BaseModel):
    slug: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=100)
    name_en: str | None = Field(None, min_length=1, max_length=100)
    name_es: str | None = Field(None, min_length=1, max_length=100)
    tag_type: str | None = Field(None, min_length=1, max_length=30)
    parent_slug: str | None = None
    display_order: int | None = None


class CardTagsUpdate(BaseModel):
    """Request to update a card's tags."""
    tag_slugs: list[str] = Field(..., min_length=1)
