"""Placeholder replacement utility for card text.

Replaces placeholders like {{partner}}, {{user}}, etc. with actual names.
"""

import re
from typing import Optional

from app.models.user import User


def get_display_name(user: Optional[User]) -> str:
    """Get the display name for a user (nickname or name)."""
    if not user:
        return "Pareja"
    return user.nickname or user.name


def replace_placeholders(
    text: str,
    user: Optional[User] = None,
    partner: Optional[User] = None,
) -> str:
    """
    Replace placeholders in text with actual values.

    Supported placeholders:
    - {{partner}} or {{pareja}} - Partner's nickname or name
    - {{user}} or {{me}} or {{yo}} - Current user's nickname or name
    - {{partner_name}} - Partner's full name (not nickname)
    - {{user_name}} - User's full name (not nickname)

    Args:
        text: The text containing placeholders
        user: The current user object
        partner: The partner user object

    Returns:
        Text with placeholders replaced
    """
    if not text:
        return text

    # Get display names
    user_display = get_display_name(user)
    partner_display = get_display_name(partner)
    user_full = user.name if user else "Usuario"
    partner_full = partner.name if partner else "Pareja"

    # Define replacements (case-insensitive)
    replacements = {
        r'\{\{partner\}\}': partner_display,
        r'\{\{pareja\}\}': partner_display,
        r'\{\{user\}\}': user_display,
        r'\{\{me\}\}': user_display,
        r'\{\{yo\}\}': user_display,
        r'\{\{partner_name\}\}': partner_full,
        r'\{\{user_name\}\}': user_full,
    }

    result = text
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    return result


def replace_placeholders_in_card(
    card_dict: dict,
    user: Optional[User] = None,
    partner: Optional[User] = None,
) -> dict:
    """
    Replace placeholders in card title and description.

    Args:
        card_dict: Card data as dictionary
        user: The current user object
        partner: The partner user object

    Returns:
        Card dict with placeholders replaced in title and description
    """
    result = card_dict.copy()

    if "title" in result and result["title"]:
        result["title"] = replace_placeholders(result["title"], user, partner)

    if "description" in result and result["description"]:
        result["description"] = replace_placeholders(result["description"], user, partner)

    return result
