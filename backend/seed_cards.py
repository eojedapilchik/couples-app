"""Seed script - Import cards from JSON templates and create initial users."""

import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, create_tables
from app.models.user import User
from app.models.card import Card, CardCategory, CardSource, CardStatus
from app.models.credit import CreditBalance
from app.auth import hash_pin
from app.services.credit_service import CreditService


# Map JSON files to categories
CATEGORY_MAP = {
    "calientes_full_1to1.json": CardCategory.CALIENTES,
    "romance_full_1to1.json": CardCategory.ROMANCE,
    "risas_full_1to1.json": CardCategory.RISAS,
    "otras_full_1to1.json": CardCategory.OTRAS,
}

# Credit values based on category (spicier = more credits)
CREDIT_VALUES = {
    CardCategory.CALIENTES: 5,  # Higher for spicy
    CardCategory.ROMANCE: 3,
    CardCategory.RISAS: 2,
    CardCategory.OTRAS: 3,
}

# Spice levels based on category
SPICE_LEVELS = {
    CardCategory.CALIENTES: 4,
    CardCategory.ROMANCE: 2,
    CardCategory.RISAS: 1,
    CardCategory.OTRAS: 2,
}


def seed_users(db):
    """Create the two partner users."""
    # Check if users already exist
    existing = db.query(User).count()
    if existing > 0:
        print(f"Users already exist ({existing}), skipping...")
        return

    # Default PIN for both: 1234 (users should change this)
    default_pin = "1234"
    pin_hash = hash_pin(default_pin)

    user1 = User(name="Pareja A", pin_hash=pin_hash)
    user2 = User(name="Pareja B", pin_hash=pin_hash)

    db.add(user1)
    db.add(user2)
    db.commit()
    db.refresh(user1)
    db.refresh(user2)

    # Grant initial credits
    CreditService.grant_initial_credits(db, user1.id, amount=10)
    CreditService.grant_initial_credits(db, user2.id, amount=10)

    print(f"Created users: {user1.name} (ID: {user1.id}), {user2.name} (ID: {user2.id})")
    print(f"Default PIN for both: {default_pin}")
    print("Initial credits: 10 each")


def seed_cards_from_json(db, json_path: Path, category: CardCategory):
    """Import cards from a JSON file."""
    if not json_path.exists():
        print(f"File not found: {json_path}")
        return 0

    with open(json_path, "r", encoding="utf-8") as f:
        cards_data = json.load(f)

    count = 0
    for card_data in cards_data:
        # Check if card with same title exists
        existing = db.query(Card).filter(Card.title == card_data["title"]).first()
        if existing:
            continue

        card = Card(
            title=card_data["title"],
            description=card_data["description"],
            category=category,
            spice_level=SPICE_LEVELS.get(category, 2),
            difficulty_level=2,  # Default medium difficulty
            credit_value=CREDIT_VALUES.get(category, 3),
            source=CardSource.IMPORTED,
            status=CardStatus.ACTIVE,
        )
        db.add(card)
        count += 1

    db.commit()
    return count


def main():
    """Main seed function."""
    print("Creating database tables...")
    create_tables()

    db = SessionLocal()
    try:
        print("\n--- Seeding Users ---")
        seed_users(db)

        print("\n--- Seeding Cards ---")
        # Check multiple possible paths for card templates
        # Docker mounts at /app/card_templates, local dev at ../card_templates
        possible_paths = [
            Path(__file__).parent / "card_templates",  # Docker: /app/card_templates
            Path(__file__).parent.parent / "card_templates",  # Local: ../card_templates
            Path("/app/card_templates"),  # Explicit Docker path
        ]

        templates_dir = None
        for path in possible_paths:
            if path.exists():
                templates_dir = path
                print(f"Found templates at: {templates_dir}")
                break

        if templates_dir is None:
            print("ERROR: Card templates directory not found!")
            print("Searched paths:")
            for path in possible_paths:
                print(f"  - {path}")
            return

        total_cards = 0
        for filename, category in CATEGORY_MAP.items():
            json_path = templates_dir / filename
            count = seed_cards_from_json(db, json_path, category)
            print(f"  {category.value}: {count} cards imported from {filename}")
            total_cards += count

        print(f"\nTotal cards imported: {total_cards}")

        # Show summary
        print("\n--- Summary ---")
        user_count = db.query(User).count()
        card_count = db.query(Card).count()
        print(f"Users: {user_count}")
        print(f"Cards: {card_count}")

        for category in CardCategory:
            cat_count = db.query(Card).filter(Card.category == category).count()
            print(f"  - {category.value}: {cat_count}")

    finally:
        db.close()

    print("\nSeed completed!")


if __name__ == "__main__":
    main()
