"""Add groupings and card_groupings tables

Revision ID: 014
Revises: 013
Create Date: 2025-12-23 00:00:01.000000

"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


INITIAL_GROUPINGS = [
    {"slug": "standard", "name": "Estandar", "description": None, "display_order": 1},
    {"slug": "spicy", "name": "Caliente", "description": None, "display_order": 2},
    {"slug": "very_spicy", "name": "Muy Caliente", "description": None, "display_order": 3},
    {"slug": "extreme", "name": "Extremo", "description": None, "display_order": 4},
    {"slug": "romance", "name": "Romance", "description": None, "display_order": 5},
    {"slug": "risas", "name": "Risas", "description": None, "display_order": 6},
    {"slug": "otras", "name": "Otras", "description": None, "display_order": 7},
]


INTENSITY_MAP = {
    "standard": "standard",
    "estandar": "standard",
    "spicy": "spicy",
    "picante": "spicy",
    "very_spicy": "very_spicy",
    "muy_picante": "very_spicy",
    "extreme": "extreme",
    "extremo": "extreme",
}


def _extract_intensity(tags_json: str | None) -> str | None:
    if not tags_json:
        return None
    try:
        data = json.loads(tags_json)
    except Exception:
        return None

    intensity = data.get("intensity")
    if isinstance(intensity, str):
        return intensity

    tags_list = data.get("tags")
    if isinstance(tags_list, list):
        for tag in tags_list:
            if tag in INTENSITY_MAP:
                return tag

    return None


def upgrade() -> None:
    op.create_table(
        "groupings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_groupings_slug", "groupings", ["slug"], unique=True)

    op.create_table(
        "card_groupings",
        sa.Column("card_id", sa.Integer(), nullable=False),
        sa.Column("grouping_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["card_id"], ["cards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["grouping_id"], ["groupings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("card_id", "grouping_id"),
    )
    op.create_index("ix_card_groupings_card", "card_groupings", ["card_id"])
    op.create_index("ix_card_groupings_grouping", "card_groupings", ["grouping_id"])

    groupings_table = sa.table(
        "groupings",
        sa.column("slug", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("display_order", sa.Integer),
    )
    op.bulk_insert(groupings_table, INITIAL_GROUPINGS)

    bind = op.get_bind()
    result = bind.execute(sa.text("SELECT id, slug FROM groupings"))
    grouping_id_map = {row.slug: row.id for row in result}

    card_groupings_table = sa.table(
        "card_groupings",
        sa.column("card_id", sa.Integer),
        sa.column("grouping_id", sa.Integer),
    )

    cards_result = bind.execute(sa.text("SELECT id, category, tags FROM cards"))
    card_groupings_data = []
    for card_id, category, tags_json in cards_result:
        grouping_slug = None
        if category == "calientes":
            intensity = _extract_intensity(tags_json)
            grouping_slug = INTENSITY_MAP.get(intensity or "standard", "standard")
        else:
            grouping_slug = category

        grouping_id = grouping_id_map.get(grouping_slug)
        if grouping_id:
            card_groupings_data.append(
                {"card_id": card_id, "grouping_id": grouping_id}
            )

    if card_groupings_data:
        op.bulk_insert(card_groupings_table, card_groupings_data)


def downgrade() -> None:
    op.drop_index("ix_card_groupings_grouping", table_name="card_groupings")
    op.drop_index("ix_card_groupings_card", table_name="card_groupings")
    op.drop_table("card_groupings")
    op.drop_index("ix_groupings_slug", table_name="groupings")
    op.drop_table("groupings")
