"""Update user names and PINs."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, create_tables
from app.models.user import User
from app.auth import hash_pin


def main():
    create_tables()
    db = SessionLocal()

    try:
        users = db.query(User).all()

        for user in users:
            if "A" in user.name or user.name == "Pareja A":
                user.name = "Poti"
                user.pin_hash = hash_pin("2506")
                print(f"Updated user {user.id}: Poti (PIN: 2506)")
            elif "B" in user.name or user.name == "Pareja B":
                user.name = "Osi"
                user.pin_hash = hash_pin("2105")
                print(f"Updated user {user.id}: Osi (PIN: 2105)")

        db.commit()
        print("\nUsers updated successfully!")

        # Show current users
        print("\nCurrent users:")
        for user in db.query(User).all():
            print(f"  - {user.name} (ID: {user.id})")

    finally:
        db.close()


if __name__ == "__main__":
    main()
