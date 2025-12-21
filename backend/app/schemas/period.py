"""Period schemas - Request/Response DTOs."""

from datetime import datetime, date
from pydantic import BaseModel, Field

from app.models.period import PeriodType, PeriodStatus


class PeriodBase(BaseModel):
    period_type: PeriodType
    start_date: date
    weekly_base_credits: int = Field(default=3, ge=1, le=10)
    cards_to_play_per_week: int = Field(default=3, ge=1, le=10)


class PeriodCreate(PeriodBase):
    pass


class PeriodResponse(PeriodBase):
    id: int
    status: PeriodStatus
    end_date: date
    created_at: datetime
    # Computed fields
    current_week: int | None = None
    total_weeks: int | None = None

    model_config = {"from_attributes": True}


class PeriodListResponse(BaseModel):
    periods: list[PeriodResponse]
    total: int
