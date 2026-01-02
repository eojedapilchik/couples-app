"""Tag schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field


class TagResponse(BaseModel):
    id: int
    slug: str
    name: str
    tag_type: str  # category, intensity, subtag
    parent_slug: str | None = None
    display_order: int

    model_config = {"from_attributes": True}


class TagsGroupedResponse(BaseModel):
    """Tags grouped by type for the filter UI."""
    categories: list[TagResponse]
    intensity: list[TagResponse]
    subtags: list[TagResponse] = []


class CardTagsUpdate(BaseModel):
    """Request to update a card's tags."""
    tag_slugs: list[str] = Field(..., min_length=1)
