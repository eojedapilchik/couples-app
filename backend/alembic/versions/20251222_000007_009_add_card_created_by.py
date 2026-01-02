"""Add created_by_user_id to cards table.

Revision ID: 009
Revises: 008
Create Date: 2025-12-22
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '009'
down_revision = '008a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add created_by_user_id column - nullable for existing cards
    op.add_column('cards', sa.Column('created_by_user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_cards_created_by_user',
        'cards', 'users',
        ['created_by_user_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_cards_created_by_user', 'cards', type_='foreignkey')
    op.drop_column('cards', 'created_by_user_id')
