"""Proposal routes - Create, respond, complete, confirm."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.proposal import ProposalStatus
from app.schemas.proposal import (
    ProposalCreate,
    ProposalResponse,
    ProposalRespondRequest,
    ProposalListResponse,
)
from app.schemas.card import CardResponse
from app.schemas.user import UserResponse
from app.services.proposal_service import ProposalService, ProposalError

router = APIRouter()


def _enrich_proposal(proposal, db) -> ProposalResponse:
    """Add card and user info to proposal response."""
    # Get display title/description from card or custom fields
    display_title = proposal.custom_title
    display_description = proposal.custom_description
    if proposal.card:
        display_title = proposal.card.title
        display_description = proposal.card.description

    return ProposalResponse(
        id=proposal.id,
        period_id=proposal.period_id,
        week_index=proposal.week_index,
        proposed_by_user_id=proposal.proposed_by_user_id,
        proposed_to_user_id=proposal.proposed_to_user_id,
        card_id=proposal.card_id,
        challenge_type=proposal.challenge_type,
        custom_title=proposal.custom_title,
        custom_description=proposal.custom_description,
        # Guided challenge fields
        why_proposing=proposal.why_proposing,
        boundary=proposal.boundary,
        # Custom challenge fields
        location=proposal.location,
        duration=proposal.duration,
        boundaries_json=proposal.boundaries_json,
        reward_type=proposal.reward_type,
        reward_details=proposal.reward_details,
        credit_cost=proposal.credit_cost,
        status=proposal.status,
        created_at=proposal.created_at,
        responded_at=proposal.responded_at,
        completed_requested_at=proposal.completed_requested_at,
        completed_confirmed_at=proposal.completed_confirmed_at,
        card=CardResponse.model_validate(proposal.card) if proposal.card else None,
        proposed_by=UserResponse.model_validate(proposal.proposed_by) if proposal.proposed_by else None,
        proposed_to=UserResponse.model_validate(proposal.proposed_to) if proposal.proposed_to else None,
        display_title=display_title,
        display_description=display_description,
    )


@router.post("", response_model=ProposalResponse)
def create_proposal(
    proposal: ProposalCreate,
    user_id: int = Query(..., description="Current user ID (proposer)"),
    db: Session = Depends(get_db),
):
    """Create a new proposal. Can be from card OR custom reto. Proposing is FREE."""
    try:
        new_proposal = ProposalService.create_proposal(
            db,
            period_id=proposal.period_id,
            week_index=proposal.week_index,
            proposed_by_user_id=user_id,
            proposed_to_user_id=proposal.proposed_to_user_id,
            card_id=proposal.card_id,
            custom_title=proposal.custom_title,
            custom_description=proposal.custom_description,
            # Challenge type and guided/custom fields
            challenge_type=proposal.challenge_type,
            why_proposing=proposal.why_proposing,
            boundary=proposal.boundary,
            location=proposal.location,
            duration=proposal.duration,
            boundaries_json=proposal.boundaries_json,
            reward_type=proposal.reward_type,
            reward_details=proposal.reward_details,
        )
        return _enrich_proposal(new_proposal, db)
    except ProposalError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=ProposalListResponse)
def get_proposals(
    user_id: int = Query(..., description="User ID"),
    as_recipient: bool = Query(True, description="True=received, False=sent"),
    status: ProposalStatus | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get proposals for a user."""
    proposals, total = ProposalService.get_proposals_for_user(
        db, user_id, as_recipient=as_recipient, status=status, limit=limit, offset=offset
    )
    return ProposalListResponse(
        proposals=[_enrich_proposal(p, db) for p in proposals],
        total=total,
    )


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    """Get a single proposal."""
    proposal = ProposalService.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")
    return _enrich_proposal(proposal, db)


@router.patch("/{proposal_id}/respond", response_model=ProposalResponse)
def respond_to_proposal(
    proposal_id: int,
    request: ProposalRespondRequest,
    user_id: int = Query(..., description="Current user ID (recipient)"),
    db: Session = Depends(get_db),
):
    """
    Respond to a proposal (accept/maybe_later/reject).
    When accepting, must provide credit_cost (1-7).
    """
    if not request.validate_response():
        raise HTTPException(
            status_code=400,
            detail="Respuesta debe ser: accepted, maybe_later, o rejected",
        )

    try:
        proposal = ProposalService.respond_to_proposal(
            db, proposal_id, user_id, request.response, request.credit_cost
        )
        return _enrich_proposal(proposal, db)
    except ProposalError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{proposal_id}/complete", response_model=ProposalResponse)
def mark_proposal_complete(
    proposal_id: int,
    user_id: int = Query(..., description="Current user ID (recipient)"),
    db: Session = Depends(get_db),
):
    """Recipient marks proposal as completed (pending confirmation)."""
    try:
        proposal = ProposalService.mark_as_completed(db, proposal_id, user_id)
        return _enrich_proposal(proposal, db)
    except ProposalError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{proposal_id}/confirm", response_model=ProposalResponse)
def confirm_proposal_completion(
    proposal_id: int,
    user_id: int = Query(..., description="Current user ID (proposer)"),
    db: Session = Depends(get_db),
):
    """Proposer confirms completion. Awards credits to recipient."""
    try:
        proposal = ProposalService.confirm_completion(db, proposal_id, user_id)
        return _enrich_proposal(proposal, db)
    except ProposalError as e:
        raise HTTPException(status_code=400, detail=str(e))
