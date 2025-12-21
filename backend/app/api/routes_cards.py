"""Card routes - CRUD and voting."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.card import CardCategory
from app.schemas.card import (
    CardCreate,
    CardResponse,
    CardListResponse,
    VoteRequest,
    VoteResponse,
    PreferenceVoteResponse,
)
from app.services.card_service import CardService

router = APIRouter()


@router.get("", response_model=CardListResponse)
def get_cards(
    category: CardCategory | None = None,
    user_id: int | None = Query(None, description="Current user ID for preferences"),
    partner_id: int | None = Query(None, description="Partner ID for preferences"),
    unvoted_only: bool = Query(False, description="Only return cards user hasn't voted on"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get cards with optional filtering and preferences."""
    if user_id and partner_id:
        # Return cards with preference info
        cards_data, total = CardService.get_cards_with_preferences(
            db, user_id, partner_id, category=category, limit=limit, offset=offset,
            unvoted_only=unvoted_only
        )
        cards = [CardResponse(**c) for c in cards_data]
    else:
        # Return plain cards
        cards_orm, total = CardService.get_cards(
            db, category=category, limit=limit, offset=offset
        )
        cards = [CardResponse.model_validate(c) for c in cards_orm]

    return CardListResponse(cards=cards, total=total)


@router.get("/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    """Get a single card by ID."""
    card = CardService.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")
    return CardResponse.model_validate(card)


@router.post("", response_model=CardResponse)
def create_card(card: CardCreate, db: Session = Depends(get_db)):
    """Create a new card."""
    new_card = CardService.create_card(
        db,
        title=card.title,
        description=card.description,
        category=card.category,
        spice_level=card.spice_level,
        difficulty_level=card.difficulty_level,
        credit_value=card.credit_value,
        tags=card.tags,
        source=card.source.value,
    )
    return CardResponse.model_validate(new_card)


@router.post("/{card_id}/vote", response_model=VoteResponse)
def vote_on_card(
    card_id: int,
    vote: VoteRequest,
    user_id: int = Query(..., description="Current user ID"),
    db: Session = Depends(get_db),
):
    """Vote on a card (like/dislike/neutral)."""
    card = CardService.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    CardService.vote_on_card(db, user_id, card_id, vote.preference)

    return VoteResponse(
        card_id=card_id,
        user_id=user_id,
        preference=vote.preference,
        message="Voto registrado",
    )


@router.get("/{card_id}/preferences", response_model=list[PreferenceVoteResponse])
def get_card_preferences(card_id: int, db: Session = Depends(get_db)):
    """Get all votes for a card."""
    card = CardService.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    votes = CardService.get_votes_for_card(db, card_id)
    return [PreferenceVoteResponse.model_validate(v) for v in votes]


@router.get("/liked/both", response_model=list[CardResponse])
def get_cards_liked_by_both(
    user1_id: int = Query(...),
    user2_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """Get cards liked by both users."""
    cards = CardService.get_liked_by_both(db, user1_id, user2_id)
    return [CardResponse.model_validate(c) for c in cards]


@router.delete("/{card_id}", response_model=CardResponse)
def archive_card(card_id: int, db: Session = Depends(get_db)):
    """Archive a card (soft delete)."""
    card = CardService.archive_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")
    return CardResponse.model_validate(card)
