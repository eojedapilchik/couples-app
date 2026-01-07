"""Add backoffice users table

Revision ID: 012
Revises: 011
Create Date: 2025-12-22 00:00:10.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '012'
down_revision: Union[str, None] = '011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PASSWORD_HASH = "b586a863e4fb4d535d327c6312f5af96b1e52ee120077d87df0be9ce8c5697a7"


def upgrade() -> None:
    op.create_table(
        "backoffice_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("username", name="uq_backoffice_users_username"),
    )

    backoffice_users_table = sa.table(
        "backoffice_users",
        sa.column("username", sa.String(length=50)),
        sa.column("password_hash", sa.String(length=64)),
    )
    op.bulk_insert(
        backoffice_users_table,
        [
            {"username": "eojedapilchik", "password_hash": PASSWORD_HASH},
            {"username": "kikiloide", "password_hash": PASSWORD_HASH},
        ],
    )


def downgrade() -> None:
    op.drop_table("backoffice_users")
