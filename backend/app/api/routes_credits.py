"""Credit routes - Balance and ledger."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.credit import (
    CreditBalanceResponse,
    CreditLedgerResponse,
    CreditLedgerListResponse,
)
from app.services.credit_service import CreditService

router = APIRouter()


@router.get("/balance", response_model=CreditBalanceResponse)
def get_balance(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db),
):
    """Get current credit balance for a user."""
    balance = CreditService.get_balance(db, user_id)
    return CreditBalanceResponse(user_id=user_id, balance=balance)


@router.get("/ledger", response_model=CreditLedgerListResponse)
def get_ledger(
    user_id: int = Query(..., description="User ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get credit ledger (transaction history) for a user."""
    entries, total = CreditService.get_ledger(db, user_id, limit=limit, offset=offset)
    balance = CreditService.get_balance(db, user_id)
    return CreditLedgerListResponse(
        entries=[CreditLedgerResponse.model_validate(e) for e in entries],
        total=total,
        current_balance=balance,
    )
