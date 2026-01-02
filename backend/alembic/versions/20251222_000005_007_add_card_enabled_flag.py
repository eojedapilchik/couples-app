"""Add is_enabled flag to cards for admin control.

Revision ID: 007
Revises: 006
Create Date: 2025-12-22
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_enabled column - defaults to True so all existing cards are enabled
    op.add_column('cards', sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='1'))


def downgrade() -> None:
    op.drop_column('cards', 'is_enabled')
