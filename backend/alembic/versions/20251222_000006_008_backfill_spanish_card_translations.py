"""Backfill Spanish card translations from cards table.

Revision ID: 008a
Revises: 007
Create Date: 2025-12-22
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '008a'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name

    inspector = sa.inspect(conn)
    if "card_translations" not in inspector.get_table_names():
        return
    try:
        card_columns = {col["name"] for col in inspector.get_columns("cards")}
    except Exception:
        return
    if not {"title_es", "description_es"}.issubset(card_columns):
        return

    if dialect == "sqlite":
        op.execute(
            """
            INSERT OR IGNORE INTO card_translations (card_id, locale, title, description, created_at, updated_at)
            SELECT id, 'es', title_es, description_es, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM cards
            WHERE title_es IS NOT NULL AND title_es != ''
            """
        )
    elif dialect == "mysql":
        op.execute(
            """
            INSERT IGNORE INTO card_translations (card_id, locale, title, description, created_at, updated_at)
            SELECT id, 'es', title_es, description_es, NOW(), NOW()
            FROM cards
            WHERE title_es IS NOT NULL AND title_es != ''
            """
        )
    else:
        op.execute(
            sa.text(
                """
                INSERT INTO card_translations (card_id, locale, title, description, created_at, updated_at)
                SELECT id, 'es', title_es, description_es, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM cards
                WHERE title_es IS NOT NULL AND title_es != ''
                ON CONFLICT (card_id, locale) DO NOTHING
                """
            )
        )


def downgrade() -> None:
    op.execute("DELETE FROM card_translations WHERE locale = 'es'")
