"""Tag routes - List and manage tags."""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tag import Tag
from app.models.card import Card
from app.schemas.tag import TagResponse, TagsGroupedResponse, TagCreate, TagUpdate
from app.api.admin_access import require_admin_access
from app.api.backoffice_dependencies import get_backoffice_user_optional
from app.models.backoffice_user import BackofficeUser

router = APIRouter()


def _replace_tag_slug(db: Session, old_slug: str, new_slug: str) -> None:
    if old_slug == new_slug:
        return

    cards = db.query(Card).filter(Card.tags.isnot(None)).all()
    updated = False
    for card in cards:
        try:
            tags_data = json.loads(card.tags or "{}")
        except json.JSONDecodeError:
            continue

        card_updated = False
        tags_list = tags_data.get("tags")
        if isinstance(tags_list, list):
            new_tags = [new_slug if tag == old_slug else tag for tag in tags_list]
            if new_tags != tags_list:
                tags_data["tags"] = new_tags
                card_updated = True

        if tags_data.get("intensity") == old_slug:
            tags_data["intensity"] = new_slug
            card_updated = True

        if card_updated:
            card.tags = json.dumps(tags_data)
            updated = True

    if updated:
        db.commit()


def _remove_tag_slug(db: Session, slug: str) -> None:
    cards = db.query(Card).filter(Card.tags.isnot(None)).all()
    updated = False
    for card in cards:
        try:
            tags_data = json.loads(card.tags or "{}")
        except json.JSONDecodeError:
            continue

        card_updated = False
        tags_list = tags_data.get("tags")
        if isinstance(tags_list, list):
            new_tags = [tag for tag in tags_list if tag != slug]
            if new_tags != tags_list:
                tags_data["tags"] = new_tags
                card_updated = True

        if tags_data.get("intensity") == slug:
            tags_data.pop("intensity", None)
            card_updated = True

        if card_updated:
            card.tags = json.dumps(tags_data)
            updated = True

    if updated:
        db.commit()


@router.get("", response_model=list[TagResponse])
def get_tags(
    tag_type: str | None = Query(None, description="Filter by tag type: category, intensity, subtag"),
    db: Session = Depends(get_db),
):
    """Get all tags, optionally filtered by type."""
    query = db.query(Tag)
    if tag_type:
        query = query.filter(Tag.tag_type == tag_type)
    query = query.order_by(Tag.tag_type, Tag.display_order)
    tags = query.all()
    return [TagResponse.model_validate(t) for t in tags]


@router.get("/grouped", response_model=TagsGroupedResponse)
def get_tags_grouped(db: Session = Depends(get_db)):
    """Get all tags grouped by type for the filter UI."""
    tags = db.query(Tag).order_by(Tag.display_order).all()

    categories = []
    intensity = []
    subtags = []

    for tag in tags:
        tag_resp = TagResponse.model_validate(tag)
        if tag.tag_type == "category":
            categories.append(tag_resp)
        elif tag.tag_type == "intensity":
            intensity.append(tag_resp)
        else:
            subtags.append(tag_resp)

    return TagsGroupedResponse(
        categories=categories,
        intensity=intensity,
        subtags=subtags,
    )


@router.post("", response_model=TagResponse)
def create_tag(
    tag: TagCreate,
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Create a new tag (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    existing = db.query(Tag).filter(Tag.slug == tag.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Slug ya existe")

    name_value = tag.name or tag.name_es or tag.name_en
    if not name_value:
        raise HTTPException(status_code=400, detail="Nombre requerido")

    new_tag = Tag(
        slug=tag.slug,
        name=name_value,
        name_en=tag.name_en,
        name_es=tag.name_es,
        tag_type=tag.tag_type,
        parent_slug=tag.parent_slug,
        display_order=tag.display_order,
    )
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return TagResponse.model_validate(new_tag)


@router.patch("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Update a tag (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag no encontrado")

    if tag_update.slug and tag_update.slug != tag.slug:
        existing = db.query(Tag).filter(Tag.slug == tag_update.slug).first()
        if existing:
            raise HTTPException(status_code=409, detail="Slug ya existe")

        old_slug = tag.slug
        tag.slug = tag_update.slug
        _replace_tag_slug(db, old_slug, tag_update.slug)

    if tag_update.name is not None:
        tag.name = tag_update.name
    if tag_update.name_en is not None:
        tag.name_en = tag_update.name_en
    if tag_update.name_es is not None:
        tag.name_es = tag_update.name_es
        if tag_update.name is None:
            tag.name = tag_update.name_es
    if tag_update.tag_type is not None:
        tag.tag_type = tag_update.tag_type
    if "parent_slug" in tag_update.model_fields_set:
        tag.parent_slug = tag_update.parent_slug
    if tag_update.display_order is not None:
        tag.display_order = tag_update.display_order

    db.commit()
    db.refresh(tag)
    return TagResponse.model_validate(tag)


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Delete a tag (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag no encontrado")

    slug = tag.slug
    db.delete(tag)
    db.commit()
    _remove_tag_slug(db, slug)

    return {"message": "Tag eliminado"}
