"""
Точка входа API новостного портала (вариант 9).

Запуск из корня проекта:
    .venv\\Scripts\\python -m uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import auth, news
from app.seed import seed_if_empty

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_if_empty(db)

app = FastAPI(
    title="News Portal API",
    description=(
        "Лабораторная №1, вариант 9. "
        "Чтение новостей открыто, создание и правки — после входа."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(news.router)


@app.get("/", tags=["Служебные"])
def root():
    return {
        "message": "News Portal API",
        "docs": "/docs",
        "redoc": "/redoc",
    }
