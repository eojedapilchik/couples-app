"""Increase custom_description length

Revision ID: 011
Revises: 010
Create Date: 2025-12-22 00:00:09.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '011'
down_revision: Union[str, None] = '010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'mysql':
        op.execute(
            "ALTER TABLE proposals MODIFY COLUMN custom_description VARCHAR(2000) NULL"
        )
    else:
        with op.batch_alter_table('proposals') as batch_op:
            batch_op.alter_column(
                'custom_description',
                type_=sa.String(2000),
                existing_type=sa.String(1000),
                nullable=True,
            )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'mysql':
        op.execute(
            "ALTER TABLE proposals MODIFY COLUMN custom_description VARCHAR(1000) NULL"
        )
    else:
        with op.batch_alter_table('proposals') as batch_op:
            batch_op.alter_column(
                'custom_description',
                type_=sa.String(1000),
                existing_type=sa.String(2000),
                nullable=True,
            )
