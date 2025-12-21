"""Card schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field

from app.models.card import CardCategory, CardSource, CardStatus, PreferenceType


class CardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: CardCategory
    spice_level: int = Field(default=1, ge=1, le=5)
    difficulty_level: int = Field(default=1, ge=1, le=5)
    credit_value: int = Field(default=3, ge=1, le=10)
    tags: str | None = None


class CardCreate(CardBase):
    source: CardSource = CardSource.MANUAL


class CardResponse(CardBase):
    id: int
    source: CardSource
    status: CardStatus
    created_at: datetime
    # User's vote on this card (if queried with user context)
    user_preference: PreferenceType | None = None
    # Partner's vote (for showing agreement/disagreement)
    partner_preference: PreferenceType | None = None

    model_config = {"from_attributes": True}


class CardListResponse(BaseModel):
    cards: list[CardResponse]
    total: int


class VoteRequest(BaseModel):
    preference: PreferenceType


class VoteResponse(BaseModel):
    card_id: int
    user_id: int
    preference: PreferenceType
    message: str = "Voto registrado"


class PreferenceVoteResponse(BaseModel):
    id: int
    user_id: int
    card_id: int
    preference: PreferenceType
    updated_at: datetime

    model_config = {"from_attributes": True}
