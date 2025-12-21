"""Card repository for database operations."""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.repositories.base import BaseRepository
from app.models.card import Card, PreferenceVote


class CardRepository(BaseRepository[Card]):
    """Repository for Card model operations."""

    def __init__(self, db: Session):
        super().__init__(Card, db)

    def get_by_category(
        self,
        category: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Card]:
        """Get cards by category."""
        return (
            self.db.query(Card)
            .filter(Card.category == category)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_cards(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Card]:
        """Get all active cards."""
        return (
            self.db.query(Card)
            .filter(Card.status == "active")
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_unvoted_cards(
        self,
        user_id: int,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Card]:
        """Get cards that user hasn't voted on."""
        # Subquery for cards the user has voted on
        voted_cards = (
            self.db.query(PreferenceVote.card_id)
            .filter(PreferenceVote.user_id == user_id)
            .subquery()
        )

        query = (
            self.db.query(Card)
            .filter(Card.status == "active")
            .filter(~Card.id.in_(voted_cards))
        )

        if category:
            query = query.filter(Card.category == category)

        return query.offset(skip).limit(limit).all()

    def count_by_category(self, category: str) -> int:
        """Count cards in a category."""
        return self.db.query(Card).filter(Card.category == category).count()


class PreferenceVoteRepository(BaseRepository[PreferenceVote]):
    """Repository for PreferenceVote model operations."""

    def __init__(self, db: Session):
        super().__init__(PreferenceVote, db)

    def get_vote(self, user_id: int, card_id: int) -> Optional[PreferenceVote]:
        """Get a specific vote."""
        return (
            self.db.query(PreferenceVote)
            .filter(
                and_(
                    PreferenceVote.user_id == user_id,
                    PreferenceVote.card_id == card_id,
                )
            )
            .first()
        )

    def get_user_votes(self, user_id: int) -> List[PreferenceVote]:
        """Get all votes by a user."""
        return (
            self.db.query(PreferenceVote)
            .filter(PreferenceVote.user_id == user_id)
            .all()
        )

    def get_card_votes(self, card_id: int) -> List[PreferenceVote]:
        """Get all votes for a card."""
        return (
            self.db.query(PreferenceVote)
            .filter(PreferenceVote.card_id == card_id)
            .all()
        )

    def upsert_vote(
        self,
        user_id: int,
        card_id: int,
        preference: str,
    ) -> PreferenceVote:
        """Create or update a vote."""
        vote = self.get_vote(user_id, card_id)
        if vote:
            vote.preference = preference
            self.db.commit()
            self.db.refresh(vote)
            return vote
        else:
            return self.create({
                "user_id": user_id,
                "card_id": card_id,
                "preference": preference,
            })

    def delete_all_votes(self) -> int:
        """Delete all votes. Returns count of deleted votes."""
        count = self.db.query(PreferenceVote).count()
        self.db.query(PreferenceVote).delete()
        self.db.commit()
        return count

    def get_liked_by_both(
        self,
        user1_id: int,
        user2_id: int,
    ) -> List[Card]:
        """Get cards liked by both users."""
        # Cards liked by user1
        user1_likes = (
            self.db.query(PreferenceVote.card_id)
            .filter(
                and_(
                    PreferenceVote.user_id == user1_id,
                    PreferenceVote.preference == "like",
                )
            )
            .subquery()
        )

        # Cards liked by user2 that are also liked by user1
        return (
            self.db.query(Card)
            .join(PreferenceVote)
            .filter(
                and_(
                    PreferenceVote.user_id == user2_id,
                    PreferenceVote.preference == "like",
                    PreferenceVote.card_id.in_(user1_likes),
                )
            )
            .all()
        )
