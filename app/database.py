"""
Подключение к базе данных SQLite.

База — это обычный файл news.db в корне проекта.
SQLAlchemy — переводчик между Python-объектами и таблицами в этом файле.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# sqlite:///./news.db  → файл рядом с местом, откуда запускаем uvicorn
DATABASE_URL = "sqlite:///./news.db"

# check_same_thread=False нужен именно SQLite: FastAPI отвечает на запросы
# в разных потоках, а SQLite по умолчанию этого не любит.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Базовый класс: от него наследуются все таблицы (модели)."""

    pass


def get_db():
    """
    Открывает сессию БД на время одного HTTP-запроса и закрывает её после.
    FastAPI вызывает это через Depends(get_db) в роутах.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
