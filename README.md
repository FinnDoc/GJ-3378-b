# Лабораторная №1 — API новостного портала (вариант 9)

Чтение новостей открыто. Создавать, менять и удалять может только вошедший пользователь.

## Как запустить

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Открой в браузере:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

Демо-аккаунт: логин `admin`, пароль `admin123`.

Если API уже запускали раньше и база есть, новые «учебные» новости сами не появятся. Удали файл `news.db` и перезапусти сервер — данные создадутся заново.

## Эндпоинты

| Метод | Адрес | Кто может |
|---|---|---|
| GET | `/news` | все (гости видят только опубликованные) |
| GET | `/news/{id}` | все (черновик — только после входа) |
| POST | `/news` | после входа |
| PUT | `/news/{id}` | после входа |
| DELETE | `/news/{id}` | после входа |
| GET | `/categories` | все |
| GET | `/stats` | все |
| POST | `/auth/register` | все |
| POST | `/auth/login` | все |
| GET | `/auth/me` | после входа |

Параметры списка `/news`: `category`, `q` (поиск), `sort_by`, `order`, `page`, `page_size`.
