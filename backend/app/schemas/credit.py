"""Credit schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel

from app.models.credit import LedgerType


class CreditBalanceResponse(BaseModel):
    user_id: int
    balance: int

    model_config = {"from_attributes": True}


class CreditLedgerResponse(BaseModel):
    id: int
    user_id: int
    period_id: int | None
    proposal_id: int | None
    type: LedgerType
    amount: int
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreditLedgerListResponse(BaseModel):
    entries: list[CreditLedgerResponse]
    total: int
    current_balance: int
