"""Fix proposal enum casing to match SQLAlchemy enum names

Revision ID: 017
Revises: 016
Create Date: 2025-12-24 00:00:03.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    if dialect != "mysql":
        return

    # Expand enums to allow both cases, normalize data, then lock to uppercase names.
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN challenge_type "
        "ENUM('simple', 'guided', 'custom', 'SIMPLE', 'GUIDED', 'CUSTOM') "
        "NOT NULL DEFAULT 'SIMPLE'"
    )
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN reward_type "
        "ENUM('none', 'credits', 'coupon', 'choose_next', "
        "'NONE', 'CREDITS', 'COUPON', 'CHOOSE_NEXT') NULL"
    )
    op.execute("UPDATE proposals SET challenge_type = UPPER(challenge_type)")
    op.execute(
        "UPDATE proposals SET reward_type = UPPER(reward_type) "
        "WHERE reward_type IS NOT NULL"
    )
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN challenge_type "
        "ENUM('SIMPLE', 'GUIDED', 'CUSTOM') NOT NULL DEFAULT 'SIMPLE'"
    )
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN reward_type "
        "ENUM('NONE', 'CREDITS', 'COUPON', 'CHOOSE_NEXT') NULL"
    )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    if dialect != "mysql":
        return

    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN challenge_type "
        "ENUM('simple', 'guided', 'custom', 'SIMPLE', 'GUIDED', 'CUSTOM') "
        "NOT NULL DEFAULT 'simple'"
    )
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN reward_type "
        "ENUM('none', 'credits', 'coupon', 'choose_next', "
        "'NONE', 'CREDITS', 'COUPON', 'CHOOSE_NEXT') NULL"
    )
    op.execute("UPDATE proposals SET challenge_type = LOWER(challenge_type)")
    op.execute(
        "UPDATE proposals SET reward_type = LOWER(reward_type) "
        "WHERE reward_type IS NOT NULL"
    )
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN challenge_type "
        "ENUM('simple', 'guided', 'custom') NOT NULL DEFAULT 'simple'"
    )
    op.execute(
        "ALTER TABLE proposals MODIFY COLUMN reward_type "
        "ENUM('none', 'credits', 'coupon', 'choose_next') NULL"
    )
