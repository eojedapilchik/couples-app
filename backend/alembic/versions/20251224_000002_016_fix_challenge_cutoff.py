"""Fix challenge cutoff to include ids <= 167

Revision ID: 016
Revises: 015
Create Date: 2025-12-24 00:00:02.000000

"""
from typing import Sequence, Union

import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_PARAMS = json.dumps(
    {"options": {"en": ["Yes", "No", "Maybe"], "es": ["Si", "No", "Quizas"]}}
)


def upgrade() -> None:
    bind = op.get_bind()
    # Set challenges for ids <= 167
    bind.execute(
        sa.text(
            "UPDATE cards SET is_challenge = 1, question_type = NULL, question_params = NULL "
            "WHERE id <= 167"
        )
    )
    # Set defaults for the rest
    bind.execute(
        sa.text(
            "UPDATE cards SET is_challenge = 0, question_type = 'single_select', "
            "question_params = :params WHERE id > 167"
        ),
        {"params": DEFAULT_PARAMS},
    )


def downgrade() -> None:
    # No-op: data correction not easily reversible.
    pass
