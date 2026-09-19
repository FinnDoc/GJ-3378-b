"""
Pydantic-схемы — какие данные API принимает и отдаёт.

Это не таблицы БД. Это «контракт» JSON на входе/выходе.
Если клиент пришлёт ерунду, FastAPI вернёт 422 ещё до записи в БД.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=100)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NewsCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=10)
    category: str = Field(min_length=2, max_length=50)
    author: str | None = Field(default=None, max_length=100)
    is_published: bool = True


class NewsUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    content: str | None = Field(default=None, min_length=10)
    category: str | None = Field(default=None, min_length=2, max_length=50)
    author: str | None = Field(default=None, max_length=100)
    is_published: bool | None = None


class NewsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    category: str
    author: str
    published_at: datetime
    is_published: bool
    created_at: datetime
    updated_at: datetime


class NewsListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[NewsRead]


class CategoryStat(BaseModel):
    category: str
    count: int


class StatsResponse(BaseModel):
    total_news: int
    published: int
    drafts: int
    by_category: list[CategoryStat]


SortField = Literal["published_at", "title", "id"]
SortOrder = Literal["asc", "desc"]
