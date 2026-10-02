"""
Пароли и JWT-токены.

Пароль в БД не храним как есть: кладём «хэш».
После логина выдаём токен — короткую подпись, которую клиент
потом прикладывает в заголовке Authorization: Bearer ...
"""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

# Ключ берётся из переменной окружения SECRET_KEY. Значение по умолчанию —
# только для локального запуска лабораторной, на сервере его обязательно задают.
SECRET_KEY = os.getenv("SECRET_KEY", "lab1-news-portal-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":")
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return hmac.compare_digest(digest.hex(), digest_hex)


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not isinstance(username, str):
            return None
        return username
    except jwt.PyJWTError:
        return None
