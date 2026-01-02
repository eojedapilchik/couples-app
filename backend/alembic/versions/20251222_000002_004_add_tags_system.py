"""Add tags system for flexible card filtering

Revision ID: 004
Revises: 003
Create Date: 2025-12-22 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Initial tags to seed
INITIAL_TAGS = [
    # Categories (main high-level filters)
    {"slug": "basics", "name": "Basico", "tag_type": "category", "display_order": 1},
    {"slug": "sensual", "name": "Sensual", "tag_type": "category", "display_order": 2},
    {"slug": "fantasy", "name": "Fantasias", "tag_type": "category", "display_order": 3},
    {"slug": "bdsm", "name": "BDSM", "tag_type": "category", "display_order": 4},
    {"slug": "anal", "name": "Anal", "tag_type": "category", "display_order": 5},
    {"slug": "toys", "name": "Juguetes", "tag_type": "category", "display_order": 6},
    {"slug": "public", "name": "Publico", "tag_type": "category", "display_order": 7},
    {"slug": "couple_dynamics", "name": "Dinamicas", "tag_type": "category", "display_order": 8},
    {"slug": "group", "name": "Grupo", "tag_type": "category", "display_order": 9},
    {"slug": "fetish", "name": "Fetiches", "tag_type": "category", "display_order": 10},
    # Intensity (separate axis)
    {"slug": "estandar", "name": "Estandar", "tag_type": "intensity", "display_order": 1},
    {"slug": "picante", "name": "Picante", "tag_type": "intensity", "display_order": 2},
    {"slug": "muy_picante", "name": "Muy Picante", "tag_type": "intensity", "display_order": 3},
]

# Mapping from old category to new tags
CATEGORY_TO_TAGS = {
    "CALIENTES": ["basics", "picante"],
    "ROMANCE": ["sensual", "estandar"],
    "RISAS": ["fantasy", "estandar"],
    "OTRAS": ["basics", "estandar"],
}


def upgrade() -> None:
    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('tag_type', sa.String(length=30), nullable=False),
        sa.Column('parent_slug', sa.String(length=50), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('ix_tags_type', 'tags', ['tag_type'])
    op.create_index('ix_tags_slug', 'tags', ['slug'])

    # Create card_tags junction table
    op.create_table(
        'card_tags',
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['card_id'], ['cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('card_id', 'tag_id')
    )
    op.create_index('ix_card_tags_tag', 'card_tags', ['tag_id'])

    # Seed initial tags
    bind = op.get_bind()
    tags_table = sa.table(
        'tags',
        sa.column('slug', sa.String),
        sa.column('name', sa.String),
        sa.column('tag_type', sa.String),
        sa.column('parent_slug', sa.String),
        sa.column('display_order', sa.Integer),
    )
    op.bulk_insert(tags_table, INITIAL_TAGS)

    # Migrate existing cards: map old category to new tags
    # First, get all tags we just inserted
    result = bind.execute(sa.text("SELECT id, slug FROM tags"))
    tag_id_map = {row[1]: row[0] for row in result}

    # Get all cards with their categories
    cards_result = bind.execute(sa.text("SELECT id, category FROM cards"))
    cards = list(cards_result)

    # Insert card_tags for each card based on its old category
    card_tags_data = []
    for card_id, category in cards:
        tag_slugs = CATEGORY_TO_TAGS.get(category, ["basics", "estandar"])
        for slug in tag_slugs:
            if slug in tag_id_map:
                card_tags_data.append({"card_id": card_id, "tag_id": tag_id_map[slug]})

    if card_tags_data:
        card_tags_table = sa.table(
            'card_tags',
            sa.column('card_id', sa.Integer),
            sa.column('tag_id', sa.Integer),
        )
        op.bulk_insert(card_tags_table, card_tags_data)


def downgrade() -> None:
    op.drop_index('ix_card_tags_tag', table_name='card_tags')
    op.drop_table('card_tags')
    op.drop_index('ix_tags_slug', table_name='tags')
    op.drop_index('ix_tags_type', table_name='tags')
    op.drop_table('tags')
