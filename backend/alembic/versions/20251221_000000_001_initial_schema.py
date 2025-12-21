"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-12-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('pin_hash', sa.String(length=255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Cards table
    op.create_table(
        'cards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('tags', sa.String(length=500), nullable=True),
        sa.Column('category', sa.Enum('CALIENTES', 'ROMANCE', 'RISAS', 'OTRAS', name='cardcategory'), nullable=False),
        sa.Column('spice_level', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('difficulty_level', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('credit_value', sa.Integer(), nullable=True, server_default='3'),
        sa.Column('source', sa.Enum('MANUAL', 'LLM', 'IMPORTED', name='cardsource'), nullable=True, server_default='MANUAL'),
        sa.Column('status', sa.Enum('ACTIVE', 'ARCHIVED', name='cardstatus'), nullable=True, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Periods table
    op.create_table(
        'periods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period_type', sa.Enum('WEEK', 'MONTH', 'TWO_MONTH', name='periodtype'), nullable=False),
        sa.Column('status', sa.Enum('SETUP', 'ACTIVE', 'DONE', name='periodstatus'), nullable=False, server_default='SETUP'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('weekly_base_credits', sa.Integer(), nullable=True, server_default='3'),
        sa.Column('cards_to_play_per_week', sa.Integer(), nullable=True, server_default='3'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Preference votes table
    op.create_table(
        'preference_votes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('preference', sa.Enum('LIKE', 'DISLIKE', 'NEUTRAL', name='preferencetype'), nullable=True, server_default='NEUTRAL'),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['card_id'], ['cards.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_preference_votes_user_card', 'preference_votes', ['user_id', 'card_id'], unique=True)

    # Proposals table
    op.create_table(
        'proposals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period_id', sa.Integer(), nullable=False),
        sa.Column('week_index', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('proposed_by_user_id', sa.Integer(), nullable=False),
        sa.Column('proposed_to_user_id', sa.Integer(), nullable=False),
        sa.Column('card_id', sa.Integer(), nullable=True),
        sa.Column('custom_title', sa.String(length=200), nullable=True),
        sa.Column('custom_description', sa.Text(), nullable=True),
        sa.Column('credit_cost', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('PROPOSED', 'ACCEPTED', 'MAYBE_LATER', 'REJECTED', 'COMPLETED_PENDING_CONFIRMATION', 'COMPLETED_CONFIRMED', 'EXPIRED', name='proposalstatus'), nullable=False, server_default='PROPOSED'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('completed_requested_at', sa.DateTime(), nullable=True),
        sa.Column('completed_confirmed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['card_id'], ['cards.id'], ),
        sa.ForeignKeyConstraint(['period_id'], ['periods.id'], ),
        sa.ForeignKeyConstraint(['proposed_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['proposed_to_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Credit balances table
    op.create_table(
        'credit_balances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance', sa.Integer(), nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Credit ledger table
    op.create_table(
        'credit_ledger',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('period_id', sa.Integer(), nullable=True),
        sa.Column('proposal_id', sa.Integer(), nullable=True),
        sa.Column('type', sa.Enum('WEEKLY_BASE_GRANT', 'PROPOSAL_COST', 'COMPLETION_REWARD', 'ADMIN_ADJUSTMENT', 'INITIAL_GRANT', name='ledgertype'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['period_id'], ['periods.id'], ),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('credit_ledger')
    op.drop_table('credit_balances')
    op.drop_table('proposals')
    op.drop_index('ix_preference_votes_user_card', table_name='preference_votes')
    op.drop_table('preference_votes')
    op.drop_table('periods')
    op.drop_table('cards')
    op.drop_table('users')

    # Drop enums (only needed for PostgreSQL, MySQL handles this automatically)
    op.execute("DROP TYPE IF EXISTS ledgertype")
    op.execute("DROP TYPE IF EXISTS proposalstatus")
    op.execute("DROP TYPE IF EXISTS preferencetype")
    op.execute("DROP TYPE IF EXISTS periodstatus")
    op.execute("DROP TYPE IF EXISTS periodtype")
    op.execute("DROP TYPE IF EXISTS cardstatus")
    op.execute("DROP TYPE IF EXISTS cardsource")
    op.execute("DROP TYPE IF EXISTS cardcategory")
