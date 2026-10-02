"""
Подключение к базе данных SQLite.

База — это обычный файл news.db в корне проекта.
SQLAlchemy — переводчик между Python-объектами и таблицами в этом файле.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# sqlite:///./news.db  → файл рядом с местом, откуда запускаем uvicorn
DATABASE_URL = "sqlite:///./news.db"

# check_same_thread=False нужен именно SQLite: FastAPI отвечает на запросы
# в разных потоках, а SQLite по умолчанию этого не любит.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Встроенные LOWER и LIKE в SQLite меняют регистр только у латиницы,
# поэтому «Спорт» и «спорт» для них разные строки. Регистрируем свою
# функцию на базе str.lower(), которая понимает кириллицу.
@event.listens_for(engine, "connect")
def _register_unicode_lower(dbapi_connection, _):
    dbapi_connection.create_function(
        "py_lower", 1, lambda value: value.lower() if isinstance(value, str) else value
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
