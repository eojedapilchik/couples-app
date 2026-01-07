"""Schemas for card CSV import/export responses."""

from pydantic import BaseModel, Field


class CardCsvPreviewResponse(BaseModel):
    total_rows: int = Field(..., ge=0)
    to_create: int = Field(..., ge=0)
    to_update: int = Field(..., ge=0)
    to_delete: int = Field(..., ge=0)
    errors: list[str] = Field(default_factory=list)


class CardCsvApplyResponse(BaseModel):
    created: int = Field(..., ge=0)
    updated: int = Field(..., ge=0)
    deleted: int = Field(..., ge=0)
