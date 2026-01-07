"""Grouping schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field


class GroupingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=50)
    description: str | None = Field(default=None)
    display_order: int = Field(default=0, ge=0)


class GroupingCreate(GroupingBase):
    pass


class GroupingUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    slug: str | None = Field(default=None, min_length=1, max_length=50)
    description: str | None = Field(default=None)
    display_order: int | None = Field(default=None, ge=0)


class GroupingResponse(GroupingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
