"""User repository for database operations."""

from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    """Repository for User model operations."""

    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_name(self, name: str) -> Optional[User]:
        """Get user by name."""
        return self.db.query(User).filter(User.name == name).first()

    def get_all_users(self) -> List[User]:
        """Get all users."""
        return self.db.query(User).all()

    def get_admins(self) -> List[User]:
        """Get all admin users."""
        return self.db.query(User).filter(User.is_admin == True).all()

    def set_admin(self, user_id: int, is_admin: bool = True) -> Optional[User]:
        """Set or unset admin status for a user."""
        return self.update(user_id, {"is_admin": is_admin})
