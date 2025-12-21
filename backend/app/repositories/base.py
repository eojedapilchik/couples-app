"""Base repository with common CRUD operations."""

from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, update, delete

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository providing common CRUD operations."""

    def __init__(self, model: Type[ModelType], db: Session):
        """Initialize repository with model class and database session."""
        self.model = model
        self.db = db

    def get(self, id: Any) -> Optional[ModelType]:
        """Get a single record by ID."""
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[Any] = None,
    ) -> List[ModelType]:
        """Get all records with optional pagination and ordering."""
        query = self.db.query(self.model)
        if order_by is not None:
            query = query.order_by(order_by)
        return query.offset(skip).limit(limit).all()

    def count(self) -> int:
        """Count total records."""
        return self.db.query(self.model).count()

    def create(self, obj_in: dict) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, id: Any, obj_in: dict) -> Optional[ModelType]:
        """Update an existing record."""
        db_obj = self.get(id)
        if db_obj is None:
            return None
        for key, value in obj_in.items():
            setattr(db_obj, key, value)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: Any) -> bool:
        """Delete a record by ID."""
        db_obj = self.get(id)
        if db_obj is None:
            return False
        self.db.delete(db_obj)
        self.db.commit()
        return True

    def bulk_create(self, objects: List[dict]) -> List[ModelType]:
        """Create multiple records."""
        db_objs = [self.model(**obj) for obj in objects]
        self.db.add_all(db_objs)
        self.db.commit()
        for obj in db_objs:
            self.db.refresh(obj)
        return db_objs

    def exists(self, id: Any) -> bool:
        """Check if a record exists."""
        return self.db.query(self.model).filter(self.model.id == id).count() > 0
