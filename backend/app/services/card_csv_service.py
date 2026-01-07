"""CSV import/export helpers for cards."""

from __future__ import annotations

import csv
import io
import json
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.models.card import Card, CardCategory, CardStatus
from app.models.grouping import Grouping
from app.models.tag import Tag, TagType
from app.services.card_service import CardService


CSV_COLUMNS = [
    "id",
    "title_en",
    "description_en",
    "title_es",
    "description_es",
    "category",
    "intensity",
    "tags",
    "groupings",
    "is_challenge",
    "question_type",
    "question_params",
    "is_enabled",
    "spice_level",
    "difficulty_level",
    "credit_value",
    "delete",
]

QUESTION_TYPES = {
    "single_select",
    "multi_select",
    "boolean",
    "rating",
    "text",
    "image",
}


def _normalize(value: str) -> str:
    return value.strip().lower()


def _split_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    raw = value.strip().lower()
    if raw == "":
        return None
    if raw in {"1", "true", "yes", "y", "si"}:
        return True
    if raw in {"0", "false", "no", "n"}:
        return False
    return None


def _parse_int(value: str | None) -> int | None:
    if value is None:
        return None
    raw = value.strip()
    if raw == "":
        return None
    try:
        return int(raw)
    except ValueError:
        return None


class CardCsvService:
    """CSV export/import helpers."""

    @staticmethod
    def export_cards_csv(db: Session, include_disabled: bool = True) -> str:
        tags = db.query(Tag).all()
        tag_by_slug = {tag.slug: tag for tag in tags}

        query = db.query(Card).options(
            joinedload(Card.translations),
            joinedload(Card.groupings),
        )
        query = query.filter(Card.status == CardStatus.ACTIVE)
        if not include_disabled:
            query = query.filter(Card.is_enabled == True)
        cards = query.order_by(Card.id.asc()).all()

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS)
        writer.writeheader()

        for card in cards:
            translations = {t.locale: t for t in card.translations}
            es_translation = translations.get("es")

            tags_payload = {}
            tags_list: list[str] = []
            intensity = ""
            if card.tags:
                try:
                    tags_payload = json.loads(card.tags)
                    tags_list = [
                        slug for slug in (tags_payload.get("tags", []) or [])
                        if slug != "user_created"
                    ]
                    intensity = tags_payload.get("intensity") or ""
                except json.JSONDecodeError:
                    tags_payload = {}

            def tag_label(slug: str) -> str:
                tag = tag_by_slug.get(slug)
                if not tag:
                    return slug
                return tag.name_es or tag.name or tag.slug

            tags_display = ", ".join(tag_label(slug) for slug in tags_list)
            intensity_display = tag_label(intensity) if intensity else ""

            groupings_display = ", ".join(grouping.name for grouping in card.groupings)

            writer.writerow(
                {
                    "id": card.id,
                    "title_en": card.title,
                    "description_en": card.description,
                    "title_es": es_translation.title if es_translation else "",
                    "description_es": es_translation.description if es_translation else "",
                    "category": card.category.value,
                    "intensity": intensity_display,
                    "tags": tags_display,
                    "groupings": groupings_display,
                    "is_challenge": "1" if card.is_challenge else "0",
                    "question_type": card.question_type or "",
                    "question_params": card.question_params or "",
                    "is_enabled": "1" if card.is_enabled else "0",
                    "spice_level": card.spice_level,
                    "difficulty_level": card.difficulty_level,
                    "credit_value": card.credit_value,
                    "delete": "0",
                }
            )

        return output.getvalue()

    @staticmethod
    def preview_import(
        db: Session, file_content: str
    ) -> tuple[list[dict[str, Any]], list[str], dict[str, int]]:
        rows, errors = CardCsvService._parse_csv_rows(db, file_content)
        summary = CardCsvService._build_summary(db, rows, errors)
        return rows, errors, summary

    @staticmethod
    def apply_import(
        db: Session, rows: list[dict[str, Any]], user_id: int | None
    ) -> dict[str, int]:
        created = 0
        updated = 0
        deleted = 0

        existing_cards = {
            card.id: card
            for card in db.query(Card).filter(Card.status == CardStatus.ACTIVE).all()
        }

        for row in rows:
            if row["delete"]:
                CardService.archive_card(db, row["id"])
                deleted += 1
                continue

            if row["id"] is None:
                CardService.create_card_admin(
                    db,
                    title=row["title_en"],
                    description=row["description_en"],
                    title_es=row["title_es"],
                    description_es=row["description_es"],
                    tags=row["tags"] or [],
                    intensity=row["intensity"] or "standard",
                    grouping_ids=row["grouping_ids"] or [],
                    is_challenge=row["is_challenge"] or False,
                    question_type=row["question_type"],
                    question_params=row["question_params"],
                    category=row["category"] or CardCategory.CALIENTES,
                    spice_level=row["spice_level"] or 1,
                    difficulty_level=row["difficulty_level"] or 1,
                    credit_value=row["credit_value"] or 3,
                    created_by_user_id=user_id,
                    include_user_created=False,
                )
                created += 1
                continue

            if row["id"] in existing_cards:
                CardService.update_card_admin(
                    db,
                    row["id"],
                    title=row["title_en"],
                    description=row["description_en"],
                    translations={
                        "es": {
                            "title": row["title_es"],
                            "description": row["description_es"],
                        }
                    }
                    if row["title_es"] is not None or row["description_es"] is not None
                    else None,
                    tags=row["tags"],
                    intensity=row["intensity"],
                    grouping_ids=row["grouping_ids"],
                    is_challenge=row["is_challenge"],
                    question_type=row["question_type"],
                    question_params=row["question_params"],
                )
                card = existing_cards[row["id"]]
                has_core_updates = False
                if row["is_enabled"] is not None:
                    card.is_enabled = row["is_enabled"]
                    has_core_updates = True
                if row["category"] is not None:
                    card.category = row["category"]
                    has_core_updates = True
                if row["spice_level"] is not None:
                    card.spice_level = row["spice_level"]
                    has_core_updates = True
                if row["difficulty_level"] is not None:
                    card.difficulty_level = row["difficulty_level"]
                    has_core_updates = True
                if row["credit_value"] is not None:
                    card.credit_value = row["credit_value"]
                    has_core_updates = True
                if has_core_updates:
                    db.commit()
                updated += 1
                continue

        return {
            "created": created,
            "updated": updated,
            "deleted": deleted,
        }

    @staticmethod
    def _parse_csv_rows(db: Session, file_content: str) -> tuple[list[dict[str, Any]], list[str]]:
        tags = db.query(Tag).all()
        groupings = db.query(Grouping).all()
        existing_ids = {
            card.id for card in db.query(Card.id).filter(Card.status == CardStatus.ACTIVE)
        }

        tag_lookup, tag_ambiguous = CardCsvService._build_tag_lookup(tags)
        grouping_lookup, grouping_ambiguous = CardCsvService._build_grouping_lookup(groupings)

        reader = csv.DictReader(io.StringIO(file_content))
        headers = {field.strip().lower(): field for field in (reader.fieldnames or [])}

        missing = [column for column in CSV_COLUMNS if column not in headers]
        if missing:
            return [], [f"Missing columns: {', '.join(missing)}"]

        rows: list[dict[str, Any]] = []
        errors: list[str] = []
        seen_ids: set[int] = set()

        for index, row in enumerate(reader, start=2):
            if all(not (value or "").strip() for value in row.values()):
                continue
            def cell(key: str) -> str | None:
                raw = row.get(headers[key])
                if raw is None:
                    return None
                value = raw.strip()
                return value if value != "" else None

            row_errors: list[str] = []

            raw_id = cell("id")
            row_id = _parse_int(raw_id)
            if raw_id and row_id is None:
                row_errors.append("invalid id")
            if row_id is not None:
                if row_id in seen_ids:
                    row_errors.append("duplicate id")
                seen_ids.add(row_id)
                if row_id not in existing_ids:
                    row_errors.append("id not found")

            delete_flag = _parse_bool(cell("delete"))
            if delete_flag is None:
                delete_flag = False

            title_en = cell("title_en")
            description_en = cell("description_en")
            title_es = cell("title_es")
            description_es = cell("description_es")

            raw_category = cell("category")
            category = None
            if raw_category:
                try:
                    category = CardCategory(raw_category.lower())
                except ValueError:
                    row_errors.append("invalid category")

            raw_is_challenge = cell("is_challenge")
            is_challenge = _parse_bool(raw_is_challenge)
            if raw_is_challenge and is_challenge is None:
                row_errors.append("invalid is_challenge")

            raw_is_enabled = cell("is_enabled")
            is_enabled = _parse_bool(raw_is_enabled)
            if raw_is_enabled and is_enabled is None:
                row_errors.append("invalid is_enabled")

            question_type = cell("question_type")
            if question_type and question_type not in QUESTION_TYPES:
                row_errors.append("invalid question_type")

            question_params = cell("question_params")
            if question_params:
                try:
                    json.loads(question_params)
                except json.JSONDecodeError:
                    row_errors.append("invalid question_params JSON")

            raw_spice = cell("spice_level")
            spice_level = _parse_int(raw_spice)
            if raw_spice and spice_level is None:
                row_errors.append("invalid spice_level")

            raw_difficulty = cell("difficulty_level")
            difficulty_level = _parse_int(raw_difficulty)
            if raw_difficulty and difficulty_level is None:
                row_errors.append("invalid difficulty_level")

            raw_credit = cell("credit_value")
            credit_value = _parse_int(raw_credit)
            if raw_credit and credit_value is None:
                row_errors.append("invalid credit_value")

            intensity_value = cell("intensity")
            intensity_slug = None
            if intensity_value:
                key = _normalize(intensity_value)
                if key in tag_ambiguous:
                    row_errors.append("intensity matches ambiguous value")
                tag = tag_lookup.get(key)
                if not tag:
                    row_errors.append("unknown intensity")
                elif tag.tag_type != TagType.INTENSITY.value:
                    row_errors.append("intensity must be an intensity tag")
                else:
                    intensity_slug = tag.slug

            tags_value = cell("tags")
            tags_list: list[str] | None = None
            if tags_value is not None:
                if _normalize(tags_value) in {"none", "clear", "-"}:
                    tags_list = []
                else:
                    tags_list = []
                    tags_raw = _split_list(tags_value)
                    for raw_tag in tags_raw:
                        key = _normalize(raw_tag)
                        if key == "user_created":
                            continue
                        if key in tag_ambiguous:
                            row_errors.append(f"ambiguous tag '{raw_tag}'")
                            continue
                        tag = tag_lookup.get(key)
                        if not tag:
                            row_errors.append(f"unknown tag '{raw_tag}'")
                            continue
                        if tag.tag_type == TagType.INTENSITY.value:
                            if intensity_slug and intensity_slug != tag.slug:
                                row_errors.append("multiple intensity tags provided")
                            intensity_slug = intensity_slug or tag.slug
                            continue
                        tags_list.append(tag.slug)

            grouping_value = cell("groupings")
            grouping_ids: list[int] | None = None
            if grouping_value is not None:
                if _normalize(grouping_value) in {"none", "clear", "-"}:
                    grouping_ids = []
                else:
                    grouping_ids = []
                    grouping_raw = _split_list(grouping_value)
                    for raw_grouping in grouping_raw:
                        key = _normalize(raw_grouping)
                        if key in grouping_ambiguous:
                            row_errors.append(f"ambiguous grouping '{raw_grouping}'")
                            continue
                        grouping = grouping_lookup.get(key)
                        if not grouping:
                            row_errors.append(f"unknown grouping '{raw_grouping}'")
                            continue
                        grouping_ids.append(grouping.id)

            if delete_flag and row_id is None:
                row_errors.append("delete requires id")

            if row_id is None and not delete_flag:
                if not title_en:
                    row_errors.append("missing title_en")
                if not description_en:
                    row_errors.append("missing description_en")
                if category is None:
                    row_errors.append("missing category")

            if row_errors:
                errors.append(f"Row {index}: {', '.join(row_errors)}")
                continue

            rows.append(
                {
                    "id": row_id,
                    "delete": delete_flag,
                    "title_en": title_en,
                    "description_en": description_en,
                    "title_es": title_es,
                    "description_es": description_es,
                    "category": category,
                    "intensity": intensity_slug,
                    "tags": tags_list,
                    "grouping_ids": grouping_ids,
                    "is_challenge": is_challenge,
                    "question_type": question_type,
                    "question_params": question_params,
                    "is_enabled": is_enabled,
                    "spice_level": spice_level,
                    "difficulty_level": difficulty_level,
                    "credit_value": credit_value,
                }
            )

        return rows, errors

    @staticmethod
    def _build_summary(
        db: Session, rows: list[dict[str, Any]], errors: list[str]
    ) -> dict[str, int]:
        if errors:
            return {
                "total_rows": len(rows),
                "to_create": 0,
                "to_update": 0,
                "to_delete": 0,
            }

        existing_ids = {
            card.id for card in db.query(Card.id).filter(Card.status == CardStatus.ACTIVE)
        }

        to_create = 0
        to_update = 0
        to_delete = 0

        for row in rows:
            if row["delete"]:
                to_delete += 1
                continue
            if row["id"] is None:
                to_create += 1
            elif row["id"] in existing_ids:
                to_update += 1

        return {
            "total_rows": len(rows),
            "to_create": to_create,
            "to_update": to_update,
            "to_delete": to_delete,
        }

    @staticmethod
    def _build_tag_lookup(
        tags: list[Tag],
    ) -> tuple[dict[str, Tag], set[str]]:
        lookup: dict[str, Tag] = {}
        ambiguous: set[str] = set()
        for tag in tags:
            for value in [tag.slug, tag.name, tag.name_en, tag.name_es]:
                if not value:
                    continue
                key = _normalize(value)
                existing = lookup.get(key)
                if existing and existing.id != tag.id:
                    ambiguous.add(key)
                    continue
                lookup[key] = tag
        return lookup, ambiguous

    @staticmethod
    def _build_grouping_lookup(
        groupings: list[Grouping],
    ) -> tuple[dict[str, Grouping], set[str]]:
        lookup: dict[str, Grouping] = {}
        ambiguous: set[str] = set()
        for grouping in groupings:
            for value in [grouping.slug, grouping.name]:
                if not value:
                    continue
                key = _normalize(value)
                existing = lookup.get(key)
                if existing and existing.id != grouping.id:
                    ambiguous.add(key)
                    continue
                lookup[key] = grouping
        return lookup, ambiguous
