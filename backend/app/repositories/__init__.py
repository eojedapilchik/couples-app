"""Repository pattern for database operations."""

from app.repositories.base import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.card_repository import CardRepository
from app.repositories.proposal_repository import ProposalRepository
from app.repositories.period_repository import PeriodRepository
from app.repositories.credit_repository import CreditRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "CardRepository",
    "ProposalRepository",
    "PeriodRepository",
    "CreditRepository",
]
