"""Database setup with SQLAlchemy - supports SQLite and MySQL."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import QueuePool, StaticPool

# Load .env file from project root
env_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(env_path)


def get_database_url() -> str:
    """Build database URL based on environment configuration."""
    db_type = os.getenv("DB_TYPE", "sqlite").lower()

    if db_type == "mysql":
        host = os.getenv("MYSQL_HOST", "localhost")
        port = os.getenv("MYSQL_PORT", "3306")
        user = os.getenv("MYSQL_USER", "couple_cards")
        password = os.getenv("MYSQL_PASSWORD", "couple_cards_secret")
        database = os.getenv("MYSQL_DATABASE", "couple_cards")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"
    else:
        # Default to SQLite
        sqlite_path = os.getenv("SQLITE_PATH", "./couple_cards.db")
        return f"sqlite:///{sqlite_path}"


def get_engine_args() -> dict:
    """Get engine arguments based on database type."""
    db_type = os.getenv("DB_TYPE", "sqlite").lower()

    if db_type == "mysql":
        return {
            "poolclass": QueuePool,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
        }
    else:
        # SQLite needs check_same_thread=False for FastAPI
        return {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool,
        }


# Database URL and engine
DATABASE_URL = get_database_url()
engine = create_engine(DATABASE_URL, **get_engine_args())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db():
    """Dependency to get DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def get_db_type() -> str:
    """Get current database type."""
    return os.getenv("DB_TYPE", "sqlite").lower()


def is_mysql() -> bool:
    """Check if using MySQL."""
    return get_db_type() == "mysql"


def is_sqlite() -> bool:
    """Check if using SQLite."""
    return get_db_type() == "sqlite"
