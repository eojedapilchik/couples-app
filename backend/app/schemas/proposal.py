"""Proposal schemas - Request/Response DTOs."""

from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from app.models.proposal import ProposalStatus
from app.schemas.card import CardResponse
from app.schemas.user import UserResponse


class ProposalCreate(BaseModel):
    """Create a proposal - either from card OR custom."""
    proposed_to_user_id: int
    period_id: int
    week_index: int = Field(default=1, ge=1)

    # Card-based (optional)
    card_id: int | None = None

    # Custom reto (optional)
    custom_title: str | None = Field(None, max_length=200)
    custom_description: str | None = Field(None, max_length=1000)

    @model_validator(mode='after')
    def validate_card_or_custom(self):
        """Must have either card_id OR custom_title."""
        if not self.card_id and not self.custom_title:
            raise ValueError("Debe proporcionar card_id o custom_title")
        return self


class ProposalResponse(BaseModel):
    id: int
    period_id: int
    week_index: int
    proposed_by_user_id: int
    proposed_to_user_id: int
    card_id: int | None
    custom_title: str | None
    custom_description: str | None
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
