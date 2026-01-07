"""Add card question fields

Revision ID: 015
Revises: 014
Create Date: 2025-12-24 00:00:01.000000

"""
from typing import Sequence, Union

import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_PARAMS = json.dumps(
    {"options": {"en": ["Yes", "No", "Maybe"], "es": ["Si", "No", "Quizas"]}}
)


def upgrade() -> None:
    op.add_column("cards", sa.Column("is_challenge", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("cards", sa.Column("question_type", sa.String(length=50), nullable=True))
    op.add_column("cards", sa.Column("question_params", sa.Text(), nullable=True))

    bind = op.get_bind()
    # Mark specific IDs as challenges
    bind.execute(
        sa.text(
            "UPDATE cards SET is_challenge = 1, question_type = NULL, question_params = NULL "
            "WHERE id BETWEEN 157 AND 167"
        )
    )
    # Set defaults for the rest
    bind.execute(
        sa.text(
            "UPDATE cards SET is_challenge = 0, question_type = 'single_select', "
            "question_params = :params WHERE id < 157 OR id > 167"
        ),
        {"params": DEFAULT_PARAMS},
    )


def downgrade() -> None:
    op.drop_column("cards", "question_params")
    op.drop_column("cards", "question_type")
    op.drop_column("cards", "is_challenge")
