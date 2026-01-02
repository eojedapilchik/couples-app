"""Add challenge types and related fields to proposals

Revision ID: 003
Revises: 002
Create Date: 2025-12-22 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the database dialect
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'mysql':
        # Add challenge_type enum column
        op.execute(
            "ALTER TABLE proposals ADD COLUMN challenge_type "
            "ENUM('simple', 'guided', 'custom') NOT NULL DEFAULT 'simple' AFTER card_id"
        )

        # Add Guided challenge fields
        op.execute(
            "ALTER TABLE proposals ADD COLUMN why_proposing VARCHAR(500) NULL "
            "AFTER custom_description"
        )
        op.execute(
            "ALTER TABLE proposals ADD COLUMN boundary VARCHAR(300) NULL "
            "AFTER why_proposing"
        )

        # Add Custom challenge fields
        op.execute(
            "ALTER TABLE proposals ADD COLUMN location VARCHAR(100) NULL "
            "AFTER boundary"
        )
        op.execute(
            "ALTER TABLE proposals ADD COLUMN duration VARCHAR(50) NULL "
            "AFTER location"
        )
        op.execute(
            "ALTER TABLE proposals ADD COLUMN boundaries_json TEXT NULL "
            "AFTER duration"
        )
        op.execute(
            "ALTER TABLE proposals ADD COLUMN reward_type "
            "ENUM('none', 'credits', 'coupon', 'choose_next') NULL "
            "AFTER boundaries_json"
        )
        op.execute(
            "ALTER TABLE proposals ADD COLUMN reward_details VARCHAR(200) NULL "
            "AFTER reward_type"
        )
    else:
        # SQLite
        op.add_column('proposals', sa.Column('challenge_type', sa.String(20), nullable=False, server_default='simple'))
        op.add_column('proposals', sa.Column('why_proposing', sa.String(500), nullable=True))
        op.add_column('proposals', sa.Column('boundary', sa.String(300), nullable=True))
        op.add_column('proposals', sa.Column('location', sa.String(100), nullable=True))
        op.add_column('proposals', sa.Column('duration', sa.String(50), nullable=True))
        op.add_column('proposals', sa.Column('boundaries_json', sa.Text(), nullable=True))
        op.add_column('proposals', sa.Column('reward_type', sa.String(20), nullable=True))
        op.add_column('proposals', sa.Column('reward_details', sa.String(200), nullable=True))


def downgrade() -> None:
    # Get the database dialect
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'mysql':
        op.execute("ALTER TABLE proposals DROP COLUMN reward_details")
        op.execute("ALTER TABLE proposals DROP COLUMN reward_type")
        op.execute("ALTER TABLE proposals DROP COLUMN boundaries_json")
        op.execute("ALTER TABLE proposals DROP COLUMN duration")
        op.execute("ALTER TABLE proposals DROP COLUMN location")
        op.execute("ALTER TABLE proposals DROP COLUMN boundary")
        op.execute("ALTER TABLE proposals DROP COLUMN why_proposing")
        op.execute("ALTER TABLE proposals DROP COLUMN challenge_type")
    else:
        op.drop_column('proposals', 'reward_details')
        op.drop_column('proposals', 'reward_type')
        op.drop_column('proposals', 'boundaries_json')
        op.drop_column('proposals', 'duration')
        op.drop_column('proposals', 'location')
        op.drop_column('proposals', 'boundary')
        op.drop_column('proposals', 'why_proposing')
        op.drop_column('proposals', 'challenge_type')
