"""Grouping routes - List and manage groupings."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.grouping import Grouping
from app.schemas.grouping import GroupingResponse, GroupingCreate, GroupingUpdate
from app.api.admin_access import require_admin_access
from app.api.backoffice_dependencies import get_backoffice_user_optional
from app.models.backoffice_user import BackofficeUser

router = APIRouter()


@router.get("", response_model=list[GroupingResponse])
def get_groupings(db: Session = Depends(get_db)):
    """Get all groupings."""
    groupings = db.query(Grouping).order_by(Grouping.display_order, Grouping.name).all()
    return [GroupingResponse.model_validate(grouping) for grouping in groupings]


@router.post("", response_model=GroupingResponse)
def create_grouping(
    grouping: GroupingCreate,
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Create a new grouping (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    existing = db.query(Grouping).filter(Grouping.slug == grouping.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Slug ya existe")

    new_grouping = Grouping(
        slug=grouping.slug,
        name=grouping.name,
        description=grouping.description,
        display_order=grouping.display_order,
    )
    db.add(new_grouping)
    db.commit()
    db.refresh(new_grouping)
    return GroupingResponse.model_validate(new_grouping)


@router.patch("/{grouping_id}", response_model=GroupingResponse)
def update_grouping(
    grouping_id: int,
    grouping_update: GroupingUpdate,
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Update a grouping (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    grouping = db.query(Grouping).filter(Grouping.id == grouping_id).first()
    if not grouping:
        raise HTTPException(status_code=404, detail="Grouping no encontrado")

    if grouping_update.slug and grouping_update.slug != grouping.slug:
        existing = db.query(Grouping).filter(Grouping.slug == grouping_update.slug).first()
        if existing:
            raise HTTPException(status_code=409, detail="Slug ya existe")
        grouping.slug = grouping_update.slug

    if grouping_update.name is not None:
        grouping.name = grouping_update.name
    if "description" in grouping_update.model_fields_set:
        grouping.description = grouping_update.description
    if grouping_update.display_order is not None:
        grouping.display_order = grouping_update.display_order

    db.commit()
    db.refresh(grouping)
    return GroupingResponse.model_validate(grouping)


@router.delete("/{grouping_id}")
def delete_grouping(
    grouping_id: int,
    user_id: int | None = Query(None, description="Admin user ID"),
    db: Session = Depends(get_db),
    backoffice_user: BackofficeUser | None = Depends(get_backoffice_user_optional),
):
    """Delete a grouping (admin only)."""
    require_admin_access(db, user_id, backoffice_user)

    grouping = db.query(Grouping).filter(Grouping.id == grouping_id).first()
    if not grouping:
        raise HTTPException(status_code=404, detail="Grouping no encontrado")

    db.delete(grouping)
    db.commit()
    return {"message": "Grouping eliminado"}
