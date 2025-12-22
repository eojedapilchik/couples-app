"""
Application configuration.

All configurable values should be defined here.
Use environment variables for deployment flexibility.
"""

import os


class AppConfig:
    """Application configuration loaded from environment variables."""

    # Currency/points system name
    # Default: "Venus" - can be customized per couple
    CURRENCY_NAME: str = os.getenv("CURRENCY_NAME", "Venus")
    CURRENCY_NAME_LOWER: str = CURRENCY_NAME.lower()


# Singleton instance
config = AppConfig()

# Convenience exports
CURRENCY_NAME = config.CURRENCY_NAME
CURRENCY_NAME_LOWER = config.CURRENCY_NAME_LOWER
