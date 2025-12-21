"""Period routes - Period management."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.period import PeriodStatus
from app.schemas.period import (
    PeriodCreate,
    PeriodResponse,
    PeriodListResponse,
)
from app.schemas.proposal import ProposalListResponse, ProposalResponse
from app.schemas.card import CardResponse
from app.schemas.user import UserResponse
from app.services.period_service import PeriodService, PeriodError
from app.services.proposal_service import ProposalService

router = APIRouter()


def _enrich_period(period) -> PeriodResponse:
    """Add computed fields to period response."""
    current_week = PeriodService.get_current_week(period)
    total_weeks = PeriodService.PERIOD_DURATIONS[period.period_type]
    return PeriodResponse(
        id=period.id,
        period_type=period.period_type,
        status=period.status,
        start_date=period.start_date,
        end_date=period.end_date,
        weekly_base_credits=period.weekly_base_credits,
        cards_to_play_per_week=period.cards_to_play_per_week,
        created_at=period.created_at,
        current_week=current_week,
        total_weeks=total_weeks,
    )


@router.post("", response_model=PeriodResponse)
def create_period(period: PeriodCreate, db: Session = Depends(get_db)):
    """Create a new period."""
    try:
        new_period = PeriodService.create_period(
            db,
            period_type=period.period_type,
            start_date=period.start_date,
            weekly_base_credits=period.weekly_base_credits,
            cards_to_play_per_week=period.cards_to_play_per_week,
        )
        return _enrich_period(new_period)
    except PeriodError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=PeriodListResponse)
def get_periods(
    status: PeriodStatus | None = None,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get periods."""
    periods, total = PeriodService.get_periods(db, status=status, limit=limit, offset=offset)
    return PeriodListResponse(
        periods=[_enrich_period(p) for p in periods],
        total=total,
    )


@router.get("/active", response_model=PeriodResponse | None)
def get_active_period(db: Session = Depends(get_db)):
    """Get the currently active period."""
    period = PeriodService.get_active_period(db)
    if not period:
        return None
    return _enrich_period(period)


@router.get("/{period_id}", response_model=PeriodResponse)
def get_period(period_id: int, db: Session = Depends(get_db)):
    """Get a single period."""
    period = PeriodService.get_period(db, period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Periodo no encontrado")
    return _enrich_period(period)


@router.patch("/{period_id}/activate", response_model=PeriodResponse)
def activate_period(period_id: int, db: Session = Depends(get_db)):
    """Activate a period."""
    try:
        period = PeriodService.activate_period(db, period_id)
        return _enrich_period(period)
    except PeriodError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{period_id}/complete", response_model=PeriodResponse)
def complete_period(period_id: int, db: Session = Depends(get_db)):
    """Mark a period as done."""
    try:
        period = PeriodService.complete_period(db, period_id)
        return _enrich_period(period)
    except PeriodError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{period_id}/proposals", response_model=ProposalListResponse)
def get_period_proposals(
    period_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all proposals for a period."""
    period = PeriodService.get_period(db, period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Periodo no encontrado")

    proposals, total = ProposalService.get_proposals_for_period(
        db, period_id, limit=limit, offset=offset
    )

    enriched = []
    for p in proposals:
        enriched.append(ProposalResponse(
            id=p.id,
            period_id=p.period_id,
            week_index=p.week_index,
            proposed_by_user_id=p.proposed_by_user_id,
            proposed_to_user_id=p.proposed_to_user_id,
            card_id=p.card_id,
            status=p.status,
            created_at=p.created_at,
            responded_at=p.responded_at,
            completed_requested_at=p.completed_requested_at,
            completed_confirmed_at=p.completed_confirmed_at,
            card=CardResponse.model_validate(p.card) if p.card else None,
            proposed_by=UserResponse.model_validate(p.proposed_by) if p.proposed_by else None,
            proposed_to=UserResponse.model_validate(p.proposed_to) if p.proposed_to else None,
        ))

    return ProposalListResponse(proposals=enriched, total=total)


@router.post("/{period_id}/grant-weekly-credits")
def grant_weekly_credits(
    period_id: int,
    user_ids: list[int],
    db: Session = Depends(get_db),
):
    """Grant weekly credits to users for a period."""
    try:
        count = PeriodService.grant_weekly_credits_to_users(db, period_id, user_ids)
        return {"message": f"Creditos otorgados a {count} usuarios"}
    except PeriodError as e:
        raise HTTPException(status_code=400, detail=str(e))
