"""Card routes - CRUD and voting."""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
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
    PartnerVotesResponse,
    CardTagsUpdate,
    CardGroupingsUpdate,
    CardContentUpdate,
    CardUpdateAdmin,
    CardCreateAdmin,
)
from app.services.card_service import CardService
from app.services.card_csv_service import CardCsvService
from app.schemas.card_csv import CardCsvPreviewResponse, CardCsvApplyResponse
from app.api.admin_access import require_admin_access
from app.api.backoffice_dependencies import get_backoffice_user_optional
from app.models.backoffice_user import BackofficeUser

router = APIRouter()


@router.get("", response_model=CardListResponse)
def get_cards(
    category: CardCategory | None = None,
    grouping_slug: str | None = Query(None, description="Grouping slug to include"),
    grouping_id: int | None = Query(None, description="Grouping ID to include"),
    user_id: int | None = Query(None, description="Current user ID for preferences"),
    partner_id: int | None = Query(None, description="Partner ID for preferences"),
    is_challenge: bool | None = Query(None, description="Filter by challenge cards"),
    tags: str | None = Query(None, description="Comma-separated tag slugs to include (OR logic)"),
    exclude_tags: str | None = Query(None, description="Comma-separated tag slugs to exclude"),
    unvoted_only: bool = Query(False, description="Only return cards user hasn't voted on"),
    voted_only: bool = Query(False, description="Only return cards user has voted on"),
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get cards with optional filtering and preferences."""
    # Parse comma-separated tags
    tags_list = [t.strip() for t in tags.split(",")] if tags else None
    exclude_tags_list = [t.strip() for t in exclude_tags.split(",")] if exclude_tags else None

    if user_id and partner_id:
        # Return cards with preference info
        cards_data, total = CardService.get_cards_with_preferences(
            db, user_id, partner_id, category=category,
            grouping_slug=grouping_slug, grouping_id=grouping_id,
            tags=tags_list, exclude_tags=exclude_tags_list, is_challenge=is_challenge,
            limit=limit, offset=offset, unvoted_only=unvoted_only,
            voted_only=voted_only, locale=locale
        )
        cards = [CardResponse(**c) for c in cards_data]
    else:
        # Return plain cards (without tag filtering for now)
        cards_orm, total = CardService.get_cards(
            db, category=category, grouping_slug=grouping_slug, grouping_id=grouping_id,
            limit=limit, offset=offset, is_challenge=is_challenge
        )
        cards = [
            CardResponse(
                **CardService._build_card_dict(
                    db, card, locale=locale, include_tags_list=True, include_groupings_list=True
                )
            )
            for card in cards_orm
        ]

    return CardListResponse(cards=cards, total=total)


# Specific routes BEFORE /{card_id} to avoid route conflicts
@router.get("/partner-votes", response_model=PartnerVotesResponse)
def get_partner_votes_grouped(
    user_id: int = Query(..., description="Current user ID"),
    partner_id: int = Query(..., description="Partner user ID"),
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    db: Session = Depends(get_db),
):
    """Get partner's votes on mutual cards, grouped by preference type."""
    result = CardService.get_partner_votes_grouped(db, user_id, partner_id, locale=locale)

    # Convert dicts to CardResponse objects
    like_cards = [CardResponse(**c) for c in result["like"]]
    maybe_cards = [CardResponse(**c) for c in result["maybe"]]
    dislike_cards = [CardResponse(**c) for c in result["dislike"]]
    neutral_cards = [CardResponse(**c) for c in result["neutral"]]

    total_mutual = len(like_cards) + len(maybe_cards) + len(dislike_cards) + len(neutral_cards)

    return PartnerVotesResponse(
        like=like_cards,
        maybe=maybe_cards,
        dislike=dislike_cards,
        neutral=neutral_cards,
        total_mutual=total_mutual,
    )


@router.get("/liked/both", response_model=list[CardResponse])
def get_cards_liked_by_both(
    user1_id: int = Query(...),
    user2_id: int = Query(...),
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    db: Session = Depends(get_db),
):
    """Get cards liked by both users."""
    cards = CardService.get_liked_by_both(db, user1_id, user2_id, locale=locale)
    return [CardResponse(**c) for c in cards]


@router.get("/{card_id}", response_model=CardResponse)
def get_card(
    card_id: int,
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    db: Session = Depends(get_db),
):
    """Get a single card by ID."""
    card = CardService.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")
    card_dict = CardService._build_card_dict(db, card, locale=locale)
    return CardResponse(**card_dict)


@router.post("", response_model=CardResponse)
def create_card(
    card: CardCreate,
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    db: Session = Depends(get_db),
):
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
        is_challenge=card.is_challenge,
        question_type=card.question_type,
        question_params=card.question_params,
        source=card.source.value,
    )
    card_dict = CardService._build_card_dict(db, new_card, locale=locale)
    return CardResponse(**card_dict)


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


@router.delete("/{card_id}/vote")
def delete_vote(
    card_id: int,
    user_id: int = Query(..., description="Current user ID"),
    db: Session = Depends(get_db),
):
    """Delete user's vote on a card."""
    deleted = CardService.delete_vote(db, user_id, card_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Voto no encontrado")
    return {"card_id": card_id, "user_id": user_id, "message": "Voto eliminado"}


@router.get("/{card_id}/preferences", response_model=list[PreferenceVoteResponse])
def get_card_preferences(card_id: int, db: Session = Depends(get_db)):
    """Get all votes for a card."""
    card = CardService.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    votes = CardService.get_votes_for_card(db, card_id)
    return [PreferenceVoteResponse.model_validate(v) for v in votes]


@router.delete("/{card_id}", response_model=CardResponse)
def archive_card(
    card_id: int,
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    db: Session = Depends(get_db),
):
    """Archive a card (soft delete)."""
    card = CardService.archive_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")
    card_dict = CardService._build_card_dict(db, card, locale=locale)
    return CardResponse(**card_dict)


# === Admin endpoints ===

@router.get("/admin/all", response_model=CardListResponse)
def get_all_cards_for_admin(
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    include_disabled: bool = Query(True, description="Include disabled cards"),
    locale: str | None = Query(None, description="Locale for translations (e.g., 'es', 'en')"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all cards for admin management (requires admin user)."""
    require_admin_access(db, user_id, backoffice_user)

    cards_data, total = CardService.get_all_cards_for_admin(
        db, limit=limit, offset=offset, include_disabled=include_disabled, locale=locale
    )
    cards = [CardResponse(**c) for c in cards_data]
    return CardListResponse(cards=cards, total=total)


@router.patch("/{card_id}/toggle")
def toggle_card_enabled(
    card_id: int,
    enabled: bool = Query(..., description="Enable or disable the card"),
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Toggle a card's enabled status (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    card = CardService.toggle_card_enabled(db, card_id, enabled)
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    return {"id": card_id, "is_enabled": enabled, "message": "Carta actualizada"}


@router.patch("/admin/bulk-toggle")
def bulk_toggle_cards(
    card_ids: list[int] = Query(..., description="List of card IDs to toggle"),
    enabled: bool = Query(..., description="Enable or disable the cards"),
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Bulk enable/disable cards (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    updated = CardService.bulk_toggle_cards(db, card_ids, enabled)
    return {"updated_count": updated, "is_enabled": enabled}


@router.patch("/{card_id}/tags")
def update_card_tags(
    card_id: int,
    tags_update: CardTagsUpdate,
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Update a card's tags and intensity (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    card_dict = CardService.update_card_tags(
        db, card_id, tags_update.tags, tags_update.intensity
    )
    if not card_dict:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    return card_dict


@router.patch("/{card_id}")
def update_card_admin(
    card_id: int,
    card_update: CardUpdateAdmin,
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Update a card (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    card_dict = CardService.update_card_admin(
        db,
        card_id,
        title=card_update.title,
        description=card_update.description,
        translations=card_update.translations,
        tags=card_update.tags,
        intensity=card_update.intensity,
        grouping_ids=card_update.grouping_ids,
        is_challenge=card_update.is_challenge,
        question_type=card_update.question_type,
        question_params=card_update.question_params,
    )
    if not card_dict:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    return card_dict


@router.patch("/{card_id}/groupings")
def update_card_groupings(
    card_id: int,
    groupings_update: CardGroupingsUpdate,
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Update a card's groupings (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    card_dict = CardService.update_card_groupings(
        db, card_id, groupings_update.grouping_ids
    )
    if not card_dict:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    return card_dict


@router.get("/{card_id}/content")
def get_card_content(
    card_id: int,
    locale: str = Query("en", description="Locale: 'en' or 'es'"),
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Get card content for a specific locale (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    content = CardService.get_card_content_by_locale(db, card_id, locale)
    if not content:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    return content


@router.patch("/{card_id}/content")
def update_card_content(
    card_id: int,
    content_update: CardContentUpdate,
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Update card title and description for a specific locale (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    card = CardService.update_card_content(
        db, card_id, content_update.title, content_update.description, content_update.locale
    )
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    return {
        "id": card_id,
        "locale": content_update.locale,
        "message": "Contenido actualizado",
    }


@router.post("/admin/create", response_model=CardResponse)
def create_card_admin(
    card_data: CardCreateAdmin,
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Create a new card with optional Spanish translation (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    card = CardService.create_card_admin(
        db,
        title=card_data.title,
        description=card_data.description,
        title_es=card_data.title_es,
        description_es=card_data.description_es,
        tags=card_data.tags,
        intensity=card_data.intensity,
        grouping_ids=card_data.grouping_ids,
        is_challenge=card_data.is_challenge,
        question_type=card_data.question_type,
        question_params=card_data.question_params,
        category=card_data.category,
        spice_level=card_data.spice_level,
        difficulty_level=card_data.difficulty_level,
        credit_value=card_data.credit_value,
        created_by_user_id=user_id,
    )

    card_dict = CardService._build_card_dict(db, card, locale="es", include_tags_list=True)
    return CardResponse(**card_dict)


@router.get("/admin/csv/export")
def export_cards_csv(
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    include_disabled: bool = Query(True, description="Include disabled cards"),
    db: Session = Depends(get_db),
):
    """Export cards to CSV (admin only)."""
    require_admin_access(db, user_id, backoffice_user)
    csv_text = CardCsvService.export_cards_csv(db, include_disabled=include_disabled)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cards_export.csv"},
    )


@router.post("/admin/csv/preview", response_model=CardCsvPreviewResponse)
def preview_cards_csv(
    file: UploadFile = File(...),
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Preview CSV import (admin only)."""
    require_admin_access(db, user_id, backoffice_user)
    try:
        content = file.file.read().decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV encoding must be UTF-8") from exc

    _, errors, summary = CardCsvService.preview_import(db, content)
    return CardCsvPreviewResponse(**summary, errors=errors)


@router.post("/admin/csv/apply", response_model=CardCsvApplyResponse)
def apply_cards_csv(
    file: UploadFile = File(...),
    user_id: int | None = Query(None, description="Admin user ID"),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
    db: Session = Depends(get_db),
):
    """Apply CSV import (admin only)."""
    require_admin_access(db, user_id, backoffice_user)
    try:
        content = file.file.read().decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV encoding must be UTF-8") from exc

    rows, errors, _summary = CardCsvService.preview_import(db, content)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    result = CardCsvService.apply_import(db, rows, user_id)
    return CardCsvApplyResponse(**result)
