"""Card schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field

from app.models.card import CardCategory, CardSource, CardStatus, PreferenceType
from app.schemas.tag import TagResponse
from app.schemas.grouping import GroupingResponse


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
    is_enabled: bool = True  # Admin can disable cards
    created_by_user_id: int | None = None  # User who created this card
    created_at: datetime
    # User's vote on this card (if queried with user context)
    user_preference: PreferenceType | None = None
    # Partner's vote (for showing agreement/disagreement)
    partner_preference: PreferenceType | None = None
    # Tags assigned to this card
    tags_list: list[TagResponse] = []
    groupings_list: list[GroupingResponse] = []

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


class PartnerVotesResponse(BaseModel):
    """Partner's votes grouped by preference type."""
    like: list[CardResponse]
    maybe: list[CardResponse]
    dislike: list[CardResponse]
    neutral: list[CardResponse]
    total_mutual: int  # Total cards both have voted on


class CardTagsUpdate(BaseModel):
    """Request to update card tags and intensity."""
    tags: list[str] = Field(..., description="List of tag slugs")
    intensity: str = Field(..., description="Intensity level: standard, spicy, very_spicy, extreme")


class CardGroupingsUpdate(BaseModel):
    """Request to update card groupings."""
    grouping_ids: list[int] = Field(default_factory=list, description="List of grouping IDs")


class CardContentUpdate(BaseModel):
    """Request to update card title and description with locale support."""
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    locale: str = Field(default="en", description="Locale: 'en' for base card, 'es' for translation")


class CardCreateAdmin(BaseModel):
    """Request to create a new card (admin)."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    title_es: str | None = Field(None, description="Spanish title")
    description_es: str | None = Field(None, description="Spanish description")
    tags: list[str] = Field(default_factory=list, description="List of tag slugs")
    intensity: str = Field(default="standard", description="Intensity level")
    grouping_ids: list[int] = Field(default_factory=list, description="List of grouping IDs")
    category: CardCategory = CardCategory.CALIENTES
    spice_level: int = Field(default=1, ge=1, le=5)
    difficulty_level: int = Field(default=1, ge=1, le=5)
    credit_value: int = Field(default=3, ge=1, le=10)
