# FoodHelper - Планировщик покупок и рецептов

Полнофункциональное веб-приложение для планирования меню, управления рецептами и автоматической генерации списков покупок.

## 🚀 Возможности

- **Онбординг** - настройка профиля и предпочтений
- **Каталог рецептов** - 21 готовый рецепт различных кухонь (русская, итальянская, азиатская и др.)
- **Рекомендации** - подбор рецептов на основе предпочтений пользователя
- **Избранное** - сохранение любимых рецептов
- **Планирование меню** - создание меню на день/неделю
- **Холодильник** - учет продуктов с AI-сканированием фото
- **Список покупок** - автоматическая генерация на основе меню

## 🛠 Технологии

### Backend
- Python 3.8+
- Flask
- SQLAlchemy (SQLite)
- Google Gemini API (для анализа изображений)

### Frontend
- React 18
- TypeScript
- React Router
- Axios

## 📦 Установка и запуск

### Для разработчиков (первый раз)

1. **Клонируйте репозиторий:**
```bash
git clone <url_репозитория>
```

2. **Создайте файл `.env` в корневой папке:**
```
GEMINI_API_KEY=
PORT=5000
DEBUG=False

``` 
*(Получите ключ на https://ai.google.dev/)*

2.2 **Создайте файл `.env` в папке frontend:**

```
PORT=3001
```
3. **Установите зависимости Backend:**
```bash
py -m pip install -r requirements.txt
```

4. **Инициализируйте базу данных:**
```bash
py init_db.py
```

5. **Установите зависимости Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
cd ..
```

6. **Запустите приложение:**

Окно 1 - Backend:
```bash
py app_backend.py
```

Окно 2 - Frontend:
```bash
cd frontend
npm start
```

7. **Откройте в браузере:** http://localhost:3001

**Важно:** 
-При отсутствии vpn ломается весь backend!!!(из-за зависимости от ai)
- VPN должен быть включен для работы AI-функций (сканирование фото)
- Оба сервера должны быть запущены одновременно

## 📁 Структура проекта

```
hackatont/
├── app_backend.py          # Основной файл бэкенда с API
├── database.py              # Модели базы данных
├── init_db.py               # Скрипт инициализации БД
├── requirements.txt         # Python зависимости
├── frontend/                # React приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── context/         # React Context
│   │   ├── services/        # API сервисы
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🎨 Дизайн

Современный минималистичный дизайн в стиле Bentofy:
- Чистый белый/серый фон
- Мягкие тени и скругленные углы
- Пастельные акцентные цвета
- Современная типографика
- Адаптивный дизайн

## 📝 API Endpoints

### Пользователи
- `POST /api/users` - создание пользователя
- `GET /api/users/:id` - получение пользователя
- `PUT /api/users/:id` - обновление пользователя

### Рецепты
- `GET /api/recipes` - список рецептов
- `GET /api/recipes/:id` - получение рецепта
- `POST /api/recipes` - создание рецепта
- `GET /api/users/:id/recipes/recommendations` - рекомендации

### Избранное
- `GET /api/users/:id/favorites` - список избранного
- `POST /api/users/:id/favorites` - добавить в избранное
- `DELETE /api/users/:id/favorites/:recipe_id` - удалить из избранного

### Меню
- `GET /api/users/:id/menus` - список меню
- `POST /api/users/:id/menus` - создание меню
- `POST /api/menus/generate` - автоматическая генерация

### Холодильник
- `GET /api/users/:id/fridge` - продукты в холодильнике
- `POST /api/users/:id/fridge` - добавить продукт
- `POST /api/analyze` - анализ фото продуктов

### Список покупок
- `POST /api/users/:id/shopping-lists/generate` - генерация списка

## 🔧 Разработка

Для разработки используйте:
- Backend: `python app_backend.py` (режим debug включен)
- Frontend: `npm start` (hot reload включен)

## 📤 Как запушить в Git

См. файл `GIT_INSTRUCTIONS.md` для подробных инструкций.

## 📄 Лицензия

Проект создан для хакатона Минск 2025

