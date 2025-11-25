# Инструкция по запуску FoodHelper

## Быстрый старт

### 1. Установка зависимостей Backend

```bash
py -m pip install -r requirements.txt
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корневой папке проекта:

```
GEMINI_API_KEY=ваш_api_ключ_здесь
```

### 3. Инициализация базы данных

```bash
py init_db.py
```

Это создаст базу данных и добавит начальные рецепты.

### 4. Запуск Backend

```bash
py app_backend.py
```

Или используйте `start_backend.bat` на Windows.

Backend будет доступен по адресу: `http://localhost:5000`

### 5. Установка зависимостей Frontend

```bash
cd frontend
npm install
```

### 6. Запуск Frontend

```bash
npm start
```

Или используйте `start_frontend.bat` на Windows.

Frontend будет доступен по адресу: `http://localhost:3001`

## Структура API

Все API endpoints начинаются с `/api/`

### Основные endpoints:

- `POST /api/users` - создание пользователя (онбординг)
- `GET /api/users/:id` - получение пользователя
- `GET /api/recipes` - список рецептов
- `GET /api/users/:id/recipes/recommendations` - рекомендации рецептов
- `GET /api/users/:id/favorites` - избранные рецепты
- `POST /api/users/:id/fridge` - добавление продукта в холодильник
- `POST /api/analyze` - анализ фото продуктов (AI)

## Решение проблем

### Ошибка 429 (Quota exceeded)

Если вы получаете ошибку 429 от Gemini API:
1. Проверьте лимиты вашего API ключа
2. Подождите несколько минут
3. Используйте модель `gemini-1.5-flash` (она уже настроена в коде)

### Проблемы с базой данных

Если база данных не создается:
1. Убедитесь, что у вас установлен SQLAlchemy
2. Проверьте права на запись в папке проекта
3. Удалите файл `foodhelper.db` и запустите `py init_db.py` снова

### Проблемы с Frontend

Если React приложение не запускается:
1. Убедитесь, что Node.js установлен (версия 16+)
2. Удалите папку `node_modules` и запустите `npm install` снова
3. Проверьте, что порт 3001 свободен

## Дополнительная информация

- Backend использует SQLite для хранения данных
- Все изображения сохраняются в папке `uploads/`
- API поддерживает CORS для работы с фронтендом

