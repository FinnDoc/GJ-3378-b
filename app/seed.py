"""Стартовые данные, чтобы API сразу было чем показать в Swagger."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import News, User, utc_now
from app.security import hash_password

DEMO_PASSWORD = "admin123"

SEED_NEWS = [
    {
        "title": "Город обновил программу поддержки студентов",
        "content": "Мэрия объявила о расширении стипендиальной программы. В новом сезоне выплаты вырастут, а заявку можно подать онлайн.",
        "category": "Политика",
        "author": "Анна Редактор",
        "days_ago": 1,
        "is_published": True,
    },
    {
        "title": "Местная команда вышла в финал чемпионата",
        "content": "В напряжённом матче хозяева победили со счётом 2:1. Финал пройдёт в ближайшие выходные на домашнем стадионе.",
        "category": "Спорт",
        "author": "Игорь Спорт",
        "days_ago": 2,
        "is_published": True,
    },
    {
        "title": "Университет открыл новую компьютерную лабораторию",
        "content": "Студенты смогут заниматься программированием на современном оборудовании и участвовать в совместных проектах с IT-компаниями города.",
        "category": "Технологии",
        "author": "Мария Наука",
        "days_ago": 3,
        "is_published": True,
    },
    {
        "title": "В филармонии стартовал фестиваль камерной музыки",
        "content": "В программе — концерты молодых исполнителей и встречи с композиторами. Билеты уже доступны на сайте площадки.",
        "category": "Культура",
        "author": "Ольга Арт",
        "days_ago": 4,
        "is_published": True,
    },
    {
        "title": "Учёные описали новый вид насекомых в заповеднике",
        "content": "Исследователи подтвердили, что найденный вид ранее не встречался в регионе. Работа опубликована в научном журнале.",
        "category": "Наука",
        "author": "Павел Биолог",
        "days_ago": 5,
        "is_published": True,
    },
    {
        "title": "Как выбрать ноутбук для учёбы: короткий гид",
        "content": "Для лекций важны автономность и клавиатура, для программирования — оперативная память. Разбираем базовые критерии без маркетинга.",
        "category": "Технологии",
        "author": "admin",
        "days_ago": 6,
        "is_published": True,
    },
    {
        "title": "Черновик: интервью с тренером перед финалом",
        "content": "Материал ещё не вычитан. Публикация запланирована после согласования цитат.",
        "category": "Спорт",
        "author": "admin",
        "days_ago": 0,
        "is_published": False,
    },
]


def seed_if_empty(db: Session) -> None:
    admin = db.query(User).filter(User.username == "admin").first()
    if admin is None:
        admin = User(username="admin", hashed_password=hash_password(DEMO_PASSWORD))
        db.add(admin)
        db.commit()
        db.refresh(admin)

    if db.query(News).count() == 0:
        now = utc_now()
        for item in SEED_NEWS:
            db.add(
                News(
                    title=item["title"],
                    content=item["content"],
                    category=item["category"],
                    author=item["author"],
                    owner_id=admin.id,
                    published_at=now - timedelta(days=item["days_ago"]),
                    is_published=item["is_published"],
                )
            )
        db.commit()
