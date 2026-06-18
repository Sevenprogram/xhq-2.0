from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_marketplace_columns()


def _ensure_marketplace_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "marketplace_deals" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("marketplace_deals")}
    statements = []
    if "merchant_key" not in columns:
        statements.append("ALTER TABLE marketplace_deals ADD COLUMN merchant_key VARCHAR(120)")
    if "merchant_display_name" not in columns:
        statements.append("ALTER TABLE marketplace_deals ADD COLUMN merchant_display_name VARCHAR(255)")

    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
