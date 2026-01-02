"""Proposal schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from app.models.proposal import ProposalStatus, ChallengeType, RewardType
from app.schemas.card import CardResponse
from app.schemas.user import UserResponse


class ProposalCreate(BaseModel):
    """Create a proposal - either from card OR custom."""
    proposed_to_user_id: int
    period_id: int
    week_index: int = Field(default=1, ge=1)

    # Challenge type (defaults to simple)
    challenge_type: ChallengeType = Field(default=ChallengeType.SIMPLE)

    # Card-based (optional)
    card_id: int | None = None

    # Custom reto (optional)
    custom_title: str | None = Field(None, max_length=200)
    custom_description: str | None = Field(None, max_length=2000)

    # Guided challenge fields (Level 2)
    why_proposing: str | None = Field(None, max_length=500)
    boundary: str | None = Field(None, max_length=300)

    # Custom challenge fields (Level 3)
    location: str | None = Field(None, max_length=100)
    duration: str | None = Field(None, max_length=50)
    boundaries_json: str | None = None  # JSON array of boundaries
    reward_type: RewardType | None = None
    reward_details: str | None = Field(None, max_length=200)

    @model_validator(mode='after')
    def validate_card_or_custom(self):
        """Must have either card_id OR custom_title."""
        if not self.card_id and not self.custom_title:
            raise ValueError("Debe proporcionar card_id o custom_title")
        return self

    @model_validator(mode='after')
    def validate_guided_fields(self):
        """Guided challenges require a boundary."""
        if self.challenge_type == ChallengeType.GUIDED and not self.boundary:
            raise ValueError("Los retos guiados requieren un limite/boundary")
        return self

    @model_validator(mode='after')
    def validate_custom_fields(self):
        """Custom challenges require location and boundaries."""
        if self.challenge_type == ChallengeType.CUSTOM:
            if not self.boundaries_json:
                raise ValueError("Los retos personalizados requieren limites/boundaries")
        return self


class ProposalUpdate(BaseModel):
    """Update a proposal before it is accepted."""
    custom_title: str | None = Field(None, max_length=200)
    custom_description: str | None = Field(None, max_length=2000)
    why_proposing: str | None = Field(None, max_length=500)
    boundary: str | None = Field(None, max_length=300)
    location: str | None = Field(None, max_length=100)
    duration: str | None = Field(None, max_length=50)
    boundaries_json: str | None = None
    reward_type: RewardType | None = None
    reward_details: str | None = Field(None, max_length=200)


class ProposalResponse(BaseModel):
    id: int
    period_id: int
    week_index: int
    proposed_by_user_id: int
    proposed_to_user_id: int
    card_id: int | None
    challenge_type: ChallengeType
    custom_title: str | None
    custom_description: str | None

    # Guided challenge fields
    why_proposing: str | None = None
    boundary: str | None = None

    # Custom challenge fields
    location: str | None = None
    duration: str | None = None
    boundaries_json: str | None = None
    reward_type: RewardType | None = None
    reward_details: str | None = None

    credit_cost: int | None
    status: ProposalStatus
    created_at: datetime
    responded_at: datetime | None
    completed_requested_at: datetime | None
    completed_confirmed_at: datetime | None
    # Expanded relations (optional)
    card: CardResponse | None = None
    proposed_by: UserResponse | None = None
    proposed_to: UserResponse | None = None

    # Computed title/description (from card or custom)
    display_title: str | None = None
    display_description: str | None = None

    model_config = {"from_attributes": True}


class ProposalRespondRequest(BaseModel):
    """Request to respond to a proposal (yes/maybe/no)."""
    response: ProposalStatus = Field(
        ...,
        description="Must be 'accepted', 'maybe_later', or 'rejected'"
    )
    # Credit cost set by recipient when accepting (max 7)
    credit_cost: int | None = Field(None, ge=1, le=7)

    @model_validator(mode='after')
    def validate_credit_cost_required_for_accept(self):
        """Credit cost required when accepting."""
        if self.response == ProposalStatus.ACCEPTED and self.credit_cost is None:
            raise ValueError("credit_cost requerido al aceptar")
        return self

    def validate_response(self) -> bool:
        """Validate that response is one of the allowed values."""
        allowed = {
            ProposalStatus.ACCEPTED,
            ProposalStatus.MAYBE_LATER,
            ProposalStatus.REJECTED,
        }
        return self.response in allowed


class ProposalListResponse(BaseModel):
    proposals: list[ProposalResponse]
    total: int
