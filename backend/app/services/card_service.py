"""Card Service - Card CRUD and voting logic."""

import random
from sqlalchemy.orm import Session

from app.models.card import Card, PreferenceVote, CardCategory, CardStatus, PreferenceType


class CardService:
    """Card operations and preference voting."""

    @staticmethod
    def get_cards(
        db: Session,
        category: CardCategory | None = None,
        status: CardStatus = CardStatus.ACTIVE,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Card], int]:
        """Get cards with optional filtering."""
        query = db.query(Card).filter(Card.status == status)
        if category:
            query = query.filter(Card.category == category)
        total = query.count()
        cards = query.order_by(Card.created_at.desc()).offset(offset).limit(limit).all()
        return cards, total

    @staticmethod
    def get_card(db: Session, card_id: int) -> Card | None:
        """Get a single card by ID."""
        return db.query(Card).filter(Card.id == card_id).first()

    @staticmethod
    def create_card(
        db: Session,
        title: str,
        description: str,
        category: CardCategory,
        spice_level: int = 1,
        difficulty_level: int = 1,
        credit_value: int = 3,
        tags: str | None = None,
        source: str = "manual",
    ) -> Card:
        """Create a new card."""
        from app.models.card import CardSource
        card = Card(
            title=title,
            description=description,
            category=category,
            spice_level=spice_level,
            difficulty_level=difficulty_level,
            credit_value=credit_value,
            tags=tags,
            source=CardSource(source),
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        return card

    @staticmethod
    def vote_on_card(
        db: Session, user_id: int, card_id: int, preference: PreferenceType
    ) -> PreferenceVote:
        """Set or update user's vote on a card."""
        vote = db.query(PreferenceVote).filter(
            PreferenceVote.user_id == user_id,
            PreferenceVote.card_id == card_id,
        ).first()

        if vote:
            vote.preference = preference
        else:
            vote = PreferenceVote(
                user_id=user_id,
                card_id=card_id,
                preference=preference,
            )
            db.add(vote)

        db.commit()
        db.refresh(vote)
        return vote

    @staticmethod
    def get_user_vote(
        db: Session, user_id: int, card_id: int
    ) -> PreferenceVote | None:
        """Get user's vote on a specific card."""
        return db.query(PreferenceVote).filter(
            PreferenceVote.user_id == user_id,
            PreferenceVote.card_id == card_id,
        ).first()

    @staticmethod
    def get_votes_for_card(
        db: Session, card_id: int
    ) -> list[PreferenceVote]:
        """Get all votes for a card."""
        return db.query(PreferenceVote).filter(
            PreferenceVote.card_id == card_id
        ).all()

    @staticmethod
    def get_cards_with_preferences(
        db: Session,
        user_id: int,
        partner_id: int,
        category: CardCategory | None = None,
        limit: int = 50,
        offset: int = 0,
        unvoted_only: bool = False,
    ) -> tuple[list[dict], int]:
        """Get cards with both users' preferences included."""
        # Build base query
        query = db.query(Card).filter(Card.status == CardStatus.ACTIVE)
        if category:
            query = query.filter(Card.category == category)

        # Filter out cards the user has already voted on
        if unvoted_only:
            voted_card_ids = db.query(PreferenceVote.card_id).filter(
                PreferenceVote.user_id == user_id
            ).subquery()
            query = query.filter(~Card.id.in_(voted_card_ids))

        total = query.count()
        cards = query.order_by(Card.created_at.desc()).offset(offset).limit(limit).all()

        # Shuffle cards when showing all categories for variety
        if category is None:
            cards = list(cards)
            random.shuffle(cards)

        result = []
        for card in cards:
            user_vote = CardService.get_user_vote(db, user_id, card.id) if not unvoted_only else None
            partner_vote = CardService.get_user_vote(db, partner_id, card.id)

            card_dict = {
                "id": card.id,
                "title": card.title,
                "description": card.description,
                "category": card.category,
                "spice_level": card.spice_level,
                "difficulty_level": card.difficulty_level,
                "credit_value": card.credit_value,
                "tags": card.tags,
                "source": card.source,
                "status": card.status,
                "created_at": card.created_at,
                "user_preference": user_vote.preference if user_vote else None,
                "partner_preference": partner_vote.preference if partner_vote else None,
            }
            result.append(card_dict)

        return result, total

    @staticmethod
    def get_liked_by_both(
        db: Session, user1_id: int, user2_id: int
    ) -> list[Card]:
        """Get cards liked by both users."""
        user1_likes = db.query(PreferenceVote.card_id).filter(
            PreferenceVote.user_id == user1_id,
            PreferenceVote.preference == PreferenceType.LIKE,
        ).subquery()

        user2_likes = db.query(PreferenceVote.card_id).filter(
            PreferenceVote.user_id == user2_id,
            PreferenceVote.preference == PreferenceType.LIKE,
        ).subquery()

        return db.query(Card).filter(
            Card.id.in_(user1_likes),
            Card.id.in_(user2_likes),
            Card.status == CardStatus.ACTIVE,
        ).all()

    @staticmethod
    def archive_card(db: Session, card_id: int) -> Card | None:
        """Archive a card."""
        card = CardService.get_card(db, card_id)
        if card:
            card.status = CardStatus.ARCHIVED
            db.commit()
            db.refresh(card)
        return card

    @staticmethod
    def get_partner_votes_grouped(
        db: Session, user_id: int, partner_id: int
    ) -> dict[str, list[dict]]:
        """
        Get cards where both users have voted, grouped by partner's preference.
        Returns dict with keys: like, maybe, dislike, neutral
        Each card includes both partner's preference and user's own preference.
        """
        # Get all cards where BOTH users have voted
        user_votes = db.query(PreferenceVote.card_id).filter(
            PreferenceVote.user_id == user_id
        ).subquery()

        partner_votes = db.query(PreferenceVote).filter(
            PreferenceVote.user_id == partner_id,
            PreferenceVote.card_id.in_(user_votes),
        ).all()

        # Group by partner's preference
        result: dict[str, list[dict]] = {
            "like": [],
            "maybe": [],
            "dislike": [],
            "neutral": [],
        }

        for partner_vote in partner_votes:
            card = db.query(Card).filter(
                Card.id == partner_vote.card_id,
                Card.status == CardStatus.ACTIVE,
            ).first()

            if not card:
                continue

            # Get user's own vote on this card
            user_vote = CardService.get_user_vote(db, user_id, card.id)

            card_dict = {
                "id": card.id,
                "title": card.title,
                "description": card.description,
                "category": card.category,
                "spice_level": card.spice_level,
                "difficulty_level": card.difficulty_level,
                "credit_value": card.credit_value,
                "tags": card.tags,
                "source": card.source,
                "status": card.status,
                "created_at": card.created_at,
                "user_preference": user_vote.preference if user_vote else None,
                "partner_preference": partner_vote.preference,
            }

            # Add to appropriate group based on partner's preference
            pref_key = partner_vote.preference.value  # like, maybe, dislike, neutral
            if pref_key in result:
                result[pref_key].append(card_dict)

        return result
