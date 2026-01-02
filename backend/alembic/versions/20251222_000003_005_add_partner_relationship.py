"""Add partner relationship to users table.

Revision ID: 005
Revises: 004
Create Date: 2025-12-22
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add nickname column for short names in placeholders
    op.add_column('users', sa.Column('nickname', sa.String(50), nullable=True))

    # Add partner_id for self-referential relationship
    op.add_column('users', sa.Column('partner_id', sa.Integer(), nullable=True))

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_users_partner_id',
        'users',
        'users',
        ['partner_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Set up the initial partner relationships (assuming users 1 and 2 are partners)
    # This is done in a transaction-safe way
    conn = op.get_bind()

    # Check if users exist before updating
    result = conn.execute(sa.text("SELECT id FROM users WHERE id IN (1, 2)"))
    users = [row[0] for row in result]

    if 1 in users and 2 in users:
        conn.execute(sa.text("UPDATE users SET partner_id = 2 WHERE id = 1"))
        conn.execute(sa.text("UPDATE users SET partner_id = 1 WHERE id = 2"))


def downgrade() -> None:
    op.drop_constraint('fk_users_partner_id', 'users', type_='foreignkey')
    op.drop_column('users', 'partner_id')
    op.drop_column('users', 'nickname')
