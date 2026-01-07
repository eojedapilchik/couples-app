"""Add tag translations and normalize intensity slugs

Revision ID: 013
Revises: 012
Create Date: 2025-12-22 00:00:11.000000

"""
from typing import Sequence, Union

import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


INTENSITY_MAP = {
    "estandar": "standard",
    "picante": "spicy",
    "muy_picante": "very_spicy",
}

INTENSITY_ES = {
    "standard": "Estandar",
    "spicy": "Picante",
    "very_spicy": "Muy Picante",
    "extreme": "Extremo",
}

INTENSITY_EN = {
    "standard": "Standard",
    "spicy": "Spicy",
    "very_spicy": "Very Spicy",
    "extreme": "Extreme",
}


def upgrade() -> None:
    op.add_column("tags", sa.Column("name_en", sa.String(length=100), nullable=True))
    op.add_column("tags", sa.Column("name_es", sa.String(length=100), nullable=True))

    bind = op.get_bind()

    # Fill Spanish names where missing.
    bind.execute(sa.text("UPDATE tags SET name_es = name WHERE name_es IS NULL"))
    bind.execute(sa.text("UPDATE tags SET name_en = name WHERE name_en IS NULL"))

    # Normalize card tag JSON to English intensity slugs.
    result = bind.execute(sa.text("SELECT id, tags FROM cards WHERE tags IS NOT NULL"))
    for card_id, tags_json in result:
        try:
            data = json.loads(tags_json)
        except Exception:
            continue

        updated = False

        tags_list = data.get("tags")
        if isinstance(tags_list, list):
            new_tags = [INTENSITY_MAP.get(tag, tag) for tag in tags_list]
            if new_tags != tags_list:
                data["tags"] = new_tags
                updated = True

        intensity = data.get("intensity")
        if intensity in INTENSITY_MAP:
            data["intensity"] = INTENSITY_MAP[intensity]
            updated = True

        if updated:
            bind.execute(
                sa.text("UPDATE cards SET tags = :tags WHERE id = :card_id"),
                {"tags": json.dumps(data), "card_id": card_id},
            )

    # Update intensity tag translations and display names.
    for slug, name_es in INTENSITY_ES.items():
        bind.execute(
            sa.text(
                """
                UPDATE tags
                SET name = :name_es,
                    name_es = :name_es,
                    name_en = :name_en
                WHERE slug = :slug AND tag_type = 'intensity'
                """
            ),
            {"slug": slug, "name_es": name_es, "name_en": INTENSITY_EN[slug]},
        )

    # Remove Spanish intensity slugs to avoid duplicates.
    bind.execute(
        sa.text(
            """
            DELETE FROM tags
            WHERE tag_type = 'intensity'
              AND slug IN ('estandar', 'picante', 'muy_picante')
            """
        )
    )


def downgrade() -> None:
    op.drop_column("tags", "name_es")
    op.drop_column("tags", "name_en")
