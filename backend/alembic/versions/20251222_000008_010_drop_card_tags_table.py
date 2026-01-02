"""Drop card_tags junction table - tags now stored in JSON only.

Revision ID: 010
Revises: 009
Create Date: 2025-12-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop card_tags table - tags are now stored in cards.tags JSON field."""
    op.drop_table('card_tags')


def downgrade() -> None:
    """Recreate card_tags junction table."""
    op.create_table(
        'card_tags',
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['card_id'], ['cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('card_id', 'tag_id'),
    )
