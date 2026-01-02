"""Add card_translations table for multi-language support.

Revision ID: 006
Revises: 005
Create Date: 2025-12-22
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create card_translations table
    op.create_table(
        'card_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(10), nullable=False),  # e.g., 'es', 'en', 'pt'
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['card_id'], ['cards.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('card_id', 'locale', name='uq_card_translation_locale'),
    )

    # Create index for faster lookups by card_id and locale
    op.create_index('ix_card_translations_card_locale', 'card_translations', ['card_id', 'locale'])


def downgrade() -> None:
    op.drop_index('ix_card_translations_card_locale', 'card_translations')
    op.drop_table('card_translations')
