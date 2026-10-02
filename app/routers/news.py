from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import false, func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.models import News, User, utc_now
from app.schemas import (
    NewsCreate,
    NewsListResponse,
    NewsRead,
    NewsUpdate,
    SortField,
    SortOrder,
    StatsResponse,
)

router = APIRouter(tags=["Новости"])


def _apply_visibility(query, user: User | None, is_published: bool | None):
    """Гость видит только опубликованное. Редактор может смотреть черновики."""
    if user is None:
        if is_published is False:
            return query.filter(false())
        return query.filter(News.is_published.is_(True))
    if is_published is not None:
        return query.filter(News.is_published == is_published)
    return query


def _get_own_news(db: Session, news_id: int, user: User) -> News:
    """Править и удалять новость может только тот, кто её создал."""
    item = db.query(News).filter(News.id == news_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    if item.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Можно изменять только свои новости",
        )
    return item


def _apply_changes(item: News, data: dict) -> None:
    was_published = item.is_published
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(item, key, value)
    if not was_published and item.is_published:
        item.published_at = utc_now()


@router.get("/news", response_model=NewsListResponse)
def list_news(
    category: str | None = Query(default=None, description="Фильтр по категории"),
    q: str | None = Query(default=None, description="Поиск по заголовку и тексту"),
    is_published: bool | None = Query(default=None),
    sort_by: SortField = Query(default="published_at"),
    order: SortOrder = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    query = db.query(News)
    query = _apply_visibility(query, user, is_published)

    if category:
        query = query.filter(func.py_lower(News.category) == category.strip().lower())

    if q:
        needle = q.strip().lower()
        query = query.filter(
            or_(
                func.py_lower(News.title).contains(needle, autoescape=True),
                func.py_lower(News.content).contains(needle, autoescape=True),
            )
        )

    sort_column = {
        "published_at": News.published_at,
        "title": News.title,
        "id": News.id,
    }[sort_by]
    query = query.order_by(sort_column.asc() if order == "asc" else sort_column.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return NewsListResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/news/{news_id}", response_model=NewsRead)
def get_news(
    news_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    item = db.query(News).filter(News.id == news_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    if not item.is_published and user is None:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return item


@router.post("/news", response_model=NewsRead, status_code=status.HTTP_201_CREATED)
def create_news(
    payload: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = News(
        title=payload.title.strip(),
        content=payload.content.strip(),
        category=payload.category.strip(),
        author=(payload.author or current_user.username).strip(),
        owner_id=current_user.id,
        is_published=payload.is_published,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/news/{news_id}", response_model=NewsRead)
def replace_news(
    news_id: int,
    payload: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Полная замена: нужно прислать все поля, как при создании."""
    item = _get_own_news(db, news_id, current_user)
    data = payload.model_dump()
    data["author"] = data["author"] or current_user.username
    _apply_changes(item, data)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/news/{news_id}", response_model=NewsRead)
def update_news(
    news_id: int,
    payload: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Частичное изменение: присылаются только те поля, которые меняем."""
    item = _get_own_news(db, news_id, current_user)
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Нет полей для обновления")
    _apply_changes(item, data)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = _get_own_news(db, news_id, current_user)
    db.delete(item)
    db.commit()
    return None


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(News.category)
        .filter(News.is_published.is_(True))
        .distinct()
        .order_by(News.category)
        .all()
    )
    return [row[0] for row in rows]


@router.get("/stats", response_model=StatsResponse)
def news_stats(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Гость видит статистику только по опубликованным новостям."""
    visible = [] if user is not None else [News.is_published.is_(True)]
    total = db.query(func.count(News.id)).filter(*visible).scalar() or 0
    published = (
        db.query(func.count(News.id)).filter(News.is_published.is_(True)).scalar() or 0
    )
    by_category_rows = (
        db.query(News.category, func.count(News.id))
        .filter(*visible)
        .group_by(News.category)
        .order_by(News.category)
        .all()
    )
    return StatsResponse(
        total_news=total,
        published=published,
        drafts=total - published,
        by_category=[{"category": name, "count": count} for name, count in by_category_rows],
    )
