"""Card Service - Card CRUD and voting logic."""

import json
import random
from sqlalchemy.orm import Session, joinedload

from app.models.card import Card, PreferenceVote, CardCategory, CardStatus, PreferenceType, CardTranslation
from app.models.tag import Tag
from app.models.grouping import Grouping
from app.models.user import User
from app.utils.placeholders import replace_placeholders_in_card

# Default locale (cards are stored in English)
DEFAULT_LOCALE = "en"


class CardService:
    """Card operations and preference voting."""

    @staticmethod
    def _get_translated_text(
        db: Session,
        card: Card,
        locale: str | None,
    ) -> tuple[str, str]:
        """
        Get translated title and description for a card.
        Falls back to card's default text (English) if no translation exists.
        """
        if not locale or locale == DEFAULT_LOCALE:
            return card.title, card.description

        # Look for translation
        translation = db.query(CardTranslation).filter(
            CardTranslation.card_id == card.id,
            CardTranslation.locale == locale,
        ).first()

        if translation:
            return translation.title, translation.description or card.description

        # Fallback to default
        return card.title, card.description

    @staticmethod
    def _build_card_dict(
        db: Session,
        card: Card,
        locale: str | None = None,
        user_vote: PreferenceVote | None = None,
        partner_vote: PreferenceVote | None = None,
        include_tags_list: bool = False,
        include_groupings_list: bool = False,
    ) -> dict:
        """Build a card response dict with optional translations and votes."""
        title, description = CardService._get_translated_text(db, card, locale)
        card_dict = {
            "id": card.id,
            "title": title,
            "description": description,
            "category": card.category,
            "spice_level": card.spice_level,
            "difficulty_level": card.difficulty_level,
            "credit_value": card.credit_value,
            "is_challenge": card.is_challenge,
            "question_type": card.question_type,
            "question_params": card.question_params,
            "tags": card.tags,
            "source": card.source,
            "status": card.status,
            "is_enabled": card.is_enabled,
            "created_by_user_id": card.created_by_user_id,
            "created_at": card.created_at,
            "user_preference": user_vote.preference if user_vote else None,
            "partner_preference": partner_vote.preference if partner_vote else None,
        }
        if include_tags_list:
            card_dict["tags_list"] = CardService._get_card_tags(db, card.id, card)
        if include_groupings_list:
            card_dict["groupings_list"] = CardService._get_card_groupings(db, card.id, card)
        return card_dict

    @staticmethod
    def get_cards(
        db: Session,
        category: CardCategory | None = None,
        grouping_slug: str | None = None,
        grouping_id: int | None = None,
        is_challenge: bool | None = None,
        status: CardStatus = CardStatus.ACTIVE,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Card], int]:
        """Get cards with optional filtering."""
        query = db.query(Card).filter(
            Card.status == status,
            Card.is_enabled == True,
        )
        if category:
            query = query.filter(Card.category == category)
        if is_challenge is not None:
            query = query.filter(Card.is_challenge == is_challenge)
        query = CardService._apply_grouping_filter(query, grouping_slug, grouping_id)
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
        is_challenge: bool = False,
        question_type: str | None = None,
        question_params: str | None = None,
        source: str = "manual",
    ) -> Card:
        """Create a new card."""
        from app.models.card import CardSource
        default_question_params = (
            question_params
            if question_params is not None
            else json.dumps(
                {"options": {"en": ["Yes", "No", "Maybe"], "es": ["Si", "No", "Quizas"]}}
            )
        )
        card = Card(
            title=title,
            description=description,
            category=category,
            spice_level=spice_level,
            difficulty_level=difficulty_level,
            credit_value=credit_value,
            tags=tags,
            source=CardSource(source),
            is_challenge=is_challenge,
            question_type=None if is_challenge else (question_type or "single_select"),
            question_params=None if is_challenge else default_question_params,
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
    def delete_vote(
        db: Session, user_id: int, card_id: int
    ) -> bool:
        """Delete user's vote on a card."""
        vote = db.query(PreferenceVote).filter(
            PreferenceVote.user_id == user_id,
            PreferenceVote.card_id == card_id,
        ).first()
        if not vote:
            return False
        db.delete(vote)
        db.commit()
        return True

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
    def _apply_tag_filters(
        db: Session,
        query,
        tags: list[str] | None = None,
        exclude_tags: list[str] | None = None,
    ):
        """Apply tag filters to a card query using JSON field."""
        from sqlalchemy import or_, and_, not_

        if tags:
            # Get cards that have ANY of the specified tags (OR logic)
            # Check if tag slug appears in the JSON (either in tags array or as intensity)
            tag_conditions = [Card.tags.like(f'%"{tag}"%') for tag in tags]
            query = query.filter(or_(*tag_conditions))

        if exclude_tags:
            # Exclude cards that have ANY of the excluded tags
            exclude_conditions = [Card.tags.like(f'%"{tag}"%') for tag in exclude_tags]
            query = query.filter(not_(or_(*exclude_conditions)))

        return query

    @staticmethod
    def _apply_grouping_filter(query, grouping_slug: str | None, grouping_id: int | None):
        """Apply grouping filters to a card query."""
        if grouping_id:
            query = query.filter(Card.groupings.any(Grouping.id == grouping_id))
        if grouping_slug:
            query = query.filter(Card.groupings.any(Grouping.slug == grouping_slug))
        return query

    @staticmethod
    def _get_card_tags(db: Session, card_id: int, card: Card | None = None) -> list[dict]:
        """Get all tags for a card by parsing JSON and looking up in tags table."""
        import json

        # Get card if not provided
        if card is None:
            card = db.query(Card).filter(Card.id == card_id).first()
        if not card or not card.tags:
            return []

        # Parse the JSON tags field
        try:
            tags_data = json.loads(card.tags)
        except json.JSONDecodeError:
            return []

        # Get all tag slugs (tags + intensity)
        slugs = tags_data.get("tags", [])
        intensity = tags_data.get("intensity")
        if intensity and intensity not in slugs:
            slugs.append(intensity)

        if not slugs:
            return []

        # Lookup tags in database
        tags = db.query(Tag).filter(Tag.slug.in_(slugs)).all()
        return [
            {
                "id": tag.id,
                "slug": tag.slug,
                "name": tag.name,
                "tag_type": tag.tag_type,
                "parent_slug": tag.parent_slug,
                "display_order": tag.display_order,
            }
            for tag in tags
        ]

    @staticmethod
    def _get_card_groupings(db: Session, card_id: int, card: Card | None = None) -> list[dict]:
        """Get all groupings for a card."""
        if card is None:
            card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            return []
        groupings = card.groupings
        return [
            {
                "id": grouping.id,
                "slug": grouping.slug,
                "name": grouping.name,
                "description": grouping.description,
                "display_order": grouping.display_order,
                "created_at": grouping.created_at,
                "updated_at": grouping.updated_at,
            }
            for grouping in groupings
        ]

    @staticmethod
    def get_cards_with_preferences(
        db: Session,
        user_id: int,
        partner_id: int,
        category: CardCategory | None = None,
        grouping_slug: str | None = None,
        grouping_id: int | None = None,
        is_challenge: bool | None = None,
        tags: list[str] | None = None,
        exclude_tags: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
        unvoted_only: bool = False,
        voted_only: bool = False,
        locale: str | None = None,
    ) -> tuple[list[dict], int]:
        """Get cards with both users' preferences included."""
        # Fetch user and partner for placeholder replacement
        user = db.query(User).filter(User.id == user_id).first()
        partner = db.query(User).filter(User.id == partner_id).first()

        # Build base query - only enabled and active cards
        query = db.query(Card).filter(
            Card.status == CardStatus.ACTIVE,
            Card.is_enabled == True
        )
        if category:
            query = query.filter(Card.category == category)
        if is_challenge is not None:
            query = query.filter(Card.is_challenge == is_challenge)

        # Apply tag filters
        query = CardService._apply_tag_filters(db, query, tags, exclude_tags)
        query = CardService._apply_grouping_filter(query, grouping_slug, grouping_id)

        # Filter based on vote status
        voted_card_ids = db.query(PreferenceVote.card_id).filter(
            PreferenceVote.user_id == user_id
        ).subquery()

        if unvoted_only:
            # Only cards the user hasn't voted on
            query = query.filter(~Card.id.in_(voted_card_ids))
        elif voted_only:
            # Only cards the user has voted on
            query = query.filter(Card.id.in_(voted_card_ids))

        total = query.count()
        cards = query.order_by(Card.created_at.desc()).offset(offset).limit(limit).all()

        # Shuffle cards for variety
        cards = list(cards)
        random.shuffle(cards)

        result = []
        for card in cards:
            user_vote = CardService.get_user_vote(db, user_id, card.id) if not unvoted_only else None
            partner_vote = CardService.get_user_vote(db, partner_id, card.id)

            card_dict = CardService._build_card_dict(
                db,
                card,
                locale=locale,
                user_vote=user_vote,
                partner_vote=partner_vote,
                include_tags_list=True,
                include_groupings_list=True,
            )
            # Replace placeholders with actual names
            card_dict = replace_placeholders_in_card(card_dict, user, partner)
            result.append(card_dict)

        return result, total

    @staticmethod
    def get_liked_by_both(
        db: Session,
        user1_id: int,
        user2_id: int,
        locale: str | None = None,
    ) -> list[dict]:
        """Get cards liked by both users."""
        user1_likes = db.query(PreferenceVote.card_id).filter(
            PreferenceVote.user_id == user1_id,
            PreferenceVote.preference == PreferenceType.LIKE,
        ).subquery()

        user2_likes = db.query(PreferenceVote.card_id).filter(
            PreferenceVote.user_id == user2_id,
            PreferenceVote.preference == PreferenceType.LIKE,
        ).subquery()

        cards = db.query(Card).filter(
            Card.id.in_(user1_likes),
            Card.id.in_(user2_likes),
            Card.status == CardStatus.ACTIVE,
        ).all()
        return [
            CardService._build_card_dict(
                db, card, locale=locale, include_groupings_list=True
            )
            for card in cards
        ]

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
        db: Session,
        user_id: int,
        partner_id: int,
        locale: str | None = None,
    ) -> dict[str, list[dict]]:
        """
        Get cards where both users have voted, grouped by partner's preference.
        Returns dict with keys: like, maybe, dislike, neutral
        Each card includes both partner's preference and user's own preference.
        """
        # Fetch user and partner for placeholder replacement
        user = db.query(User).filter(User.id == user_id).first()
        partner = db.query(User).filter(User.id == partner_id).first()

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
                Card.is_enabled == True,
            ).first()

            if not card:
                continue

            # Get user's own vote on this card
            user_vote = CardService.get_user_vote(db, user_id, card.id)

            card_dict = CardService._build_card_dict(
                db,
                card,
                locale=locale,
                user_vote=user_vote,
                partner_vote=partner_vote,
                include_tags_list=True,
                include_groupings_list=True,
            )
            # Replace placeholders with actual names
            card_dict = replace_placeholders_in_card(card_dict, user, partner)

            # Add to appropriate group based on partner's preference
            pref_key = partner_vote.preference.value  # like, maybe, dislike, neutral
            if pref_key in result:
                result[pref_key].append(card_dict)

        return result

    @staticmethod
    def toggle_card_enabled(db: Session, card_id: int, enabled: bool) -> Card | None:
        """Toggle a card's enabled status (admin only)."""
        card = CardService.get_card(db, card_id)
        if card:
            card.is_enabled = enabled
            db.commit()
            db.refresh(card)
        return card

    @staticmethod
    def get_all_cards_for_admin(
        db: Session,
        limit: int = 100,
        offset: int = 0,
        include_disabled: bool = True,
        locale: str | None = None,
    ) -> tuple[list[dict], int]:
        """Get all cards for admin management, including disabled ones."""
        query = db.query(Card).filter(Card.status == CardStatus.ACTIVE)

        if not include_disabled:
            query = query.filter(Card.is_enabled == True)

        total = query.count()
        cards = query.order_by(Card.id.asc()).offset(offset).limit(limit).all()

        result = []
        for card in cards:
            card_dict = CardService._build_card_dict(
                db,
                card,
                locale=locale,
                include_tags_list=True,
                include_groupings_list=True,
            )
            result.append(card_dict)

        return result, total

    @staticmethod
    def bulk_toggle_cards(db: Session, card_ids: list[int], enabled: bool) -> int:
        """Bulk enable/disable cards. Returns count of updated cards."""
        updated = db.query(Card).filter(Card.id.in_(card_ids)).update(
            {"is_enabled": enabled},
            synchronize_session=False
        )
        db.commit()
        return updated

    @staticmethod
    def update_card_tags(
        db: Session,
        card_id: int,
        tags: list[str],
        intensity: str,
    ) -> dict | None:
        """Update a card's tags JSON field."""
        import json
        card = CardService.get_card(db, card_id)
        if not card:
            return None

        # Build the tags JSON structure
        tags_data = {
            "tags": tags,
            "intensity": intensity,
        }
        card.tags = json.dumps(tags_data)

        db.commit()
        db.refresh(card)

        # Return full card dict with tags_list (parsed from JSON)
        return CardService._build_card_dict(
            db, card, locale="es", include_tags_list=True, include_groupings_list=True
        )

    @staticmethod
    def update_card_groupings(
        db: Session,
        card_id: int,
        grouping_ids: list[int],
    ) -> dict | None:
        """Update a card's groupings."""
        card = CardService.get_card(db, card_id)
        if not card:
            return None

        groupings = []
        if grouping_ids:
            groupings = db.query(Grouping).filter(Grouping.id.in_(grouping_ids)).all()

        card.groupings = groupings
        db.commit()
        db.refresh(card)

        return CardService._build_card_dict(
            db, card, locale="es", include_tags_list=True, include_groupings_list=True
        )

    @staticmethod
    def update_card_admin(
        db: Session,
        card_id: int,
        title: str | None = None,
        description: str | None = None,
        translations: dict[str, dict] | None = None,
        tags: list[str] | None = None,
        intensity: str | None = None,
        grouping_ids: list[int] | None = None,
        is_challenge: bool | None = None,
        question_type: str | None = None,
        question_params: str | None = None,
    ) -> dict | None:
        """Update card content, translations, tags, and groupings in one call."""
        import json

        card = CardService.get_card(db, card_id)
        if not card:
            return None

        if is_challenge is not None:
            card.is_challenge = is_challenge

        if title is not None:
            card.title = title
        if description is not None:
            card.description = description

        if translations:
            for locale, payload in translations.items():
                if hasattr(payload, "model_dump"):
                    payload = payload.model_dump(exclude_unset=True)
                if locale == "en":
                    if payload.get("title") is not None:
                        card.title = payload["title"]
                    if payload.get("description") is not None:
                        card.description = payload["description"]
                    continue

                translation = db.query(CardTranslation).filter(
                    CardTranslation.card_id == card_id,
                    CardTranslation.locale == locale,
                ).first()
                if translation:
                    if payload.get("title") is not None:
                        translation.title = payload["title"]
                    if payload.get("description") is not None:
                        translation.description = payload["description"]
                else:
                    if payload.get("title") is None and payload.get("description") is None:
                        continue
                    translation = CardTranslation(
                        card_id=card_id,
                        locale=locale,
                        title=payload.get("title") or card.title,
                        description=payload.get("description") or card.description,
                    )
                    db.add(translation)

        if tags is not None or intensity is not None:
            existing_tags = []
            existing_intensity = "standard"
            if card.tags:
                try:
                    parsed = json.loads(card.tags)
                    existing_tags = parsed.get("tags", []) if isinstance(parsed.get("tags"), list) else []
                    existing_intensity = parsed.get("intensity") or existing_intensity
                except Exception:
                    pass

            tags_data = {
                "tags": tags if tags is not None else existing_tags,
                "intensity": intensity if intensity is not None else existing_intensity,
            }
            card.tags = json.dumps(tags_data)

        if grouping_ids is not None:
            groupings = []
            if grouping_ids:
                groupings = db.query(Grouping).filter(Grouping.id.in_(grouping_ids)).all()
            card.groupings = groupings

        if card.is_challenge:
            card.question_type = None
            card.question_params = None
        else:
            if question_type is not None:
                card.question_type = question_type
            if question_params is not None:
                card.question_params = question_params
            if card.question_type is None:
                card.question_type = "single_select"
            if card.question_params is None:
                card.question_params = json.dumps(
                    {"options": {"en": ["Yes", "No", "Maybe"], "es": ["Si", "No", "Quizas"]}}
                )

        db.commit()
        db.refresh(card)

        return CardService._build_card_dict(
            db, card, locale="es", include_tags_list=True, include_groupings_list=True
        )

    @staticmethod
    def update_card_content(
        db: Session,
        card_id: int,
        title: str,
        description: str,
        locale: str = "en",
    ) -> Card | None:
        """Update card title and description. For 'en', updates base card; otherwise updates/creates translation."""
        card = CardService.get_card(db, card_id)
        if not card:
            return None

        if locale == "en":
            # Update base card
            card.title = title
            card.description = description
        else:
            # Update or create translation
            translation = db.query(CardTranslation).filter(
                CardTranslation.card_id == card_id,
                CardTranslation.locale == locale,
            ).first()

            if translation:
                translation.title = title
                translation.description = description
            else:
                translation = CardTranslation(
                    card_id=card_id,
                    locale=locale,
                    title=title,
                    description=description,
                )
                db.add(translation)

        db.commit()
        db.refresh(card)
        return card

    @staticmethod
    def get_card_content_by_locale(
        db: Session,
        card_id: int,
        locale: str = "en",
    ) -> dict | None:
        """Get card title and description for a specific locale."""
        card = CardService.get_card(db, card_id)
        if not card:
            return None

        if locale == "en":
            return {
                "title": card.title,
                "description": card.description,
                "locale": "en",
            }

        # Check for translation
        translation = db.query(CardTranslation).filter(
            CardTranslation.card_id == card_id,
            CardTranslation.locale == locale,
        ).first()

        if translation:
            return {
                "title": translation.title,
                "description": translation.description or card.description,
                "locale": locale,
            }

        # Fallback to English
        return {
            "title": card.title,
            "description": card.description,
            "locale": "en",
        }

    @staticmethod
    def create_card_admin(
        db: Session,
        title: str,
        description: str,
        title_es: str | None,
        description_es: str | None,
        tags: list[str],
        intensity: str,
        grouping_ids: list[int],
        is_challenge: bool,
        question_type: str | None,
        question_params: str | None,
        category: CardCategory,
        spice_level: int,
        difficulty_level: int,
        credit_value: int,
        created_by_user_id: int | None,
        include_user_created: bool = True,
    ) -> Card:
        """Create a new card with optional Spanish translation (admin)."""
        import json
        from app.models.card import CardSource

        # Build tags JSON
        final_tags = tags + ["user_created"] if include_user_created else tags
        tags_data = {
            "tags": final_tags,
            "intensity": intensity,
        }

        default_question_params = (
            question_params
            if question_params is not None
            else json.dumps(
                {"options": {"en": ["Yes", "No", "Maybe"], "es": ["Si", "No", "Quizas"]}}
            )
        )

        card = Card(
            title=title,
            description=description,
            category=category,
            spice_level=spice_level,
            difficulty_level=difficulty_level,
            credit_value=credit_value,
            tags=json.dumps(tags_data),
            source=CardSource.MANUAL,
            created_by_user_id=created_by_user_id,
            is_challenge=is_challenge,
            question_type=None if is_challenge else (question_type or "single_select"),
            question_params=None if is_challenge else default_question_params,
        )
        db.add(card)
        db.flush()  # Get the card ID

        if grouping_ids:
            groupings = db.query(Grouping).filter(Grouping.id.in_(grouping_ids)).all()
            card.groupings = groupings

        # Add Spanish translation if provided
        if title_es or description_es:
            translation = CardTranslation(
                card_id=card.id,
                locale="es",
                title=title_es or title,
                description=description_es or description,
            )
            db.add(translation)

        db.commit()
        db.refresh(card)
        return card
