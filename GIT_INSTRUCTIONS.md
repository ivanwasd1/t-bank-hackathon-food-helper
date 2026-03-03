# 📤 Как запушить проект в Git

## 1. Инициализация Git (если еще не сделано)

```bash
git init
```

## 2. Добавление всех файлов

```bash
git add .
```

## 3. Первый коммит

```bash
git commit -m "Initial commit: FoodHelper app"
```

## 4. Добавление удаленного репозитория

```bash
git remote add origin <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
```

Например для GitLab:
```bash
git remote add origin https://gitlab.education.tbank.ru/hakaton-minsk-2025/repos/solution-forks/Kabani-solution.git
```

## 5. Загрузка в репозиторий

```bash
git push -u origin main
```

или если ветка называется `master`:
```bash
git push -u origin master
```

## ⚠️ Важно перед пушем

1. **Проверьте `.gitignore`** - убедитесь, что там есть:
   - `.env` (не должен попасть в репозиторий!)
   - `node_modules/`
   - `*.db`
   - `instance/`
   - `__pycache__/`

2. **Создайте `.env.example`** (шаблон для других разработчиков):
```
GEMINI_API_KEY=your_api_key_here
```

## 📥 Для других разработчиков (после клонирования)

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Добавьте свой API ключ в `.env`

3. Следуйте инструкциям в `README.md` (шаги 3-7)
