"""
Зависимости FastAPI: «достань БД» и «кто сейчас залогинен».
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_access_token

# tokenUrl должен совпадать с адресом логина — тогда в Swagger появится кнопка Authorize
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
optional_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    username = decode_access_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный или просроченный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
        )
    return user


def get_optional_user(
    token: str | None = Depends(optional_oauth2),
    db: Session = Depends(get_db),
) -> User | None:
    """Если токена нет — это обычный читатель, не ошибка."""
    if not token:
        return None
    username = decode_access_token(token)
    if username is None:
        return None
    return db.query(User).filter(User.username == username).first()
