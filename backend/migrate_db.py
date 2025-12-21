"""Database migration - Add new columns."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.database import engine


def migrate():
    """Add missing columns to tables."""
    print("Running database migration...")

    with engine.connect() as conn:
        # Migrate proposals table
        result = conn.execute(text("PRAGMA table_info(proposals)"))
        proposal_columns = [row[1] for row in result.fetchall()]
        print(f"Proposals columns: {proposal_columns}")

        if 'custom_title' not in proposal_columns:
            print("Adding custom_title column...")
            conn.execute(text("ALTER TABLE proposals ADD COLUMN custom_title VARCHAR(200)"))

        if 'custom_description' not in proposal_columns:
            print("Adding custom_description column...")
            conn.execute(text("ALTER TABLE proposals ADD COLUMN custom_description VARCHAR(1000)"))

        if 'credit_cost' not in proposal_columns:
            print("Adding credit_cost column...")
            conn.execute(text("ALTER TABLE proposals ADD COLUMN credit_cost INTEGER"))

        # Migrate users table
        result = conn.execute(text("PRAGMA table_info(users)"))
        user_columns = [row[1] for row in result.fetchall()]
        print(f"Users columns: {user_columns}")

        if 'is_admin' not in user_columns:
            print("Adding is_admin column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))

        conn.commit()
        print("Migration complete!")


if __name__ == "__main__":
    migrate()
