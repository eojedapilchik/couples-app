"""Add MAYBE to PreferenceType enum

Revision ID: 002
Revises: 001
Create Date: 2025-12-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the database dialect
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'mysql':
        # MySQL: Alter the enum to add the new value (uppercase to match Python enum)
        op.execute(
            "ALTER TABLE preference_votes MODIFY COLUMN preference "
            "ENUM('LIKE', 'DISLIKE', 'NEUTRAL', 'MAYBE') NOT NULL DEFAULT 'NEUTRAL'"
        )
    # SQLite: No action needed - enums are stored as strings


def downgrade() -> None:
    # Get the database dialect
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'mysql':
        # First update any 'MAYBE' values to 'NEUTRAL'
        op.execute(
            "UPDATE preference_votes SET preference = 'NEUTRAL' WHERE preference = 'MAYBE'"
        )
        # Then alter the enum back
        op.execute(
            "ALTER TABLE preference_votes MODIFY COLUMN preference "
            "ENUM('LIKE', 'DISLIKE', 'NEUTRAL') NOT NULL DEFAULT 'NEUTRAL'"
        )
    # SQLite: No action needed
