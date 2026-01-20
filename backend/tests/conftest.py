import os
import sys
from pathlib import Path

import importlib
import pytest
from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy import inspect
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT.parent / ".env")

from app.models.user import User  # noqa: E402
import app.models  # noqa: F401,E402


def _get_test_db_settings() -> dict:
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    running_in_docker = Path("/.dockerenv").exists()
    if mysql_host == "mysql" and not running_in_docker:
        default_host = "127.0.0.1"
    else:
        default_host = mysql_host
    return {
        "host": os.getenv("TEST_DB_HOST") or default_host,
        "port": os.getenv("TEST_DB_PORT", os.getenv("MYSQL_PORT", "3306")),
        "user": os.getenv("TEST_DB_USER", os.getenv("MYSQL_USER", "couple_cards")),
        "password": os.getenv(
            "TEST_DB_PASSWORD", os.getenv("MYSQL_PASSWORD", "couple_cards_secret")
        ),
        "name": os.getenv("TEST_DB_NAME", "couple_cards_test"),
        "admin_user": os.getenv("TEST_DB_ADMIN_USER", os.getenv("MYSQL_ROOT_USER", "root")),
        "admin_password": os.getenv(
            "TEST_DB_ADMIN_PASSWORD", os.getenv("MYSQL_ROOT_PASSWORD", "root_secret")
        ),
    }


def _make_mysql_url(user: str, password: str, host: str, port: str, db: str) -> str:
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4"


@pytest.fixture(scope="session")
def test_db_url():
    settings = _get_test_db_settings()
    return _make_mysql_url(
        settings["user"],
        settings["password"],
        settings["host"],
        settings["port"],
        settings["name"],
    )


@pytest.fixture(scope="session", autouse=True)
def setup_test_database(test_db_url):
    settings = _get_test_db_settings()
    server_url = _make_mysql_url(
        settings["admin_user"],
        settings["admin_password"],
        settings["host"],
        settings["port"],
        "mysql",
    )
    server_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
    try:
        with server_engine.connect() as connection:
            connection.execute(text(f"DROP DATABASE IF EXISTS {settings['name']}"))
            connection.execute(
                text(
                    f"CREATE DATABASE {settings['name']} "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )
            connection.execute(
                text(
                    "CREATE USER IF NOT EXISTS "
                    f"'{settings['user']}'@'%' IDENTIFIED BY '{settings['password']}'"
                )
            )
            connection.execute(
                text(
                    f"GRANT ALL PRIVILEGES ON {settings['name']}.* "
                    f"TO '{settings['user']}'@'%'"
                )
            )
            connection.execute(text("FLUSH PRIVILEGES"))
    except Exception as exc:
        raise RuntimeError(
            f"Failed to create test database '{settings['name']}' on "
            f"{settings['host']}:{settings['port']}: {exc}"
        ) from exc
    finally:
        server_engine.dispose()

    os.environ["DB_TYPE"] = "mysql"
    os.environ["MYSQL_HOST"] = settings["host"]
    os.environ["MYSQL_PORT"] = settings["port"]
    os.environ["MYSQL_USER"] = settings["user"]
    os.environ["MYSQL_PASSWORD"] = settings["password"]
    os.environ["MYSQL_DATABASE"] = settings["name"]

    import app.database  # noqa: E402
    importlib.reload(app.database)

    alembic_cfg = Config(str(PROJECT_ROOT / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", test_db_url)
    alembic_cfg.set_main_option("script_location", str(PROJECT_ROOT / "alembic"))
    command.upgrade(alembic_cfg, "head")

    yield

    cleanup_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
    with cleanup_engine.connect() as connection:
        connection.execute(text(f"DROP DATABASE IF EXISTS {settings['name']}"))
    cleanup_engine.dispose()


@pytest.fixture()
def db_session(test_db_url):
    engine = create_engine(test_db_url)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = SessionLocal()
    try:
        _clear_database(engine)
        _seed_users(session)
        yield session
    finally:
        session.close()
        engine.dispose()


def _seed_users(session):
    if session.query(User).count() > 0:
        return
    session.add_all(
        [
            User(name="Test User A", pin_hash="hash_a"),
            User(name="Test User B", pin_hash="hash_b"),
        ]
    )
    session.commit()


def _clear_database(engine):
    inspector = inspect(engine)
    table_names = [name for name in inspector.get_table_names() if name != "alembic_version"]
    if not table_names:
        return
    with engine.begin() as connection:
        connection.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table_name in table_names:
            connection.execute(text(f"TRUNCATE TABLE `{table_name}`"))
        connection.execute(text("SET FOREIGN_KEY_CHECKS=1"))
