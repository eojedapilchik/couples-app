"""Tag routes - List and manage tags."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tag import Tag
from app.schemas.tag import TagResponse, TagsGroupedResponse

router = APIRouter()


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
