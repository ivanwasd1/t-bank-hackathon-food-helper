@echo off
echo ========================================
echo   Запуск FoodHelper - Backend и Frontend
echo ========================================
echo.

REM Проверка наличия Python
py --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Python не найден! Установите Python 3.8+
    pause
    exit /b 1
)

REM Проверка наличия Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Node.js не найден! Установите Node.js
    pause
    exit /b 1
)

REM Проверка .env файла
if not exist .env (
    echo [ВНИМАНИЕ] Файл .env не найден!
    echo Создайте файл .env с вашим GEMINI_API_KEY
    echo.
)

REM Проверка базы данных
if not exist foodhelper.db (
    echo [ИНФО] База данных не найдена. Инициализация...
    py init_db.py
    echo.
)

echo [1/2] Запуск Backend сервера...
start "FoodHelper Backend" cmd /k "py app_backend.py"

REM Ждем немного, чтобы backend успел запуститься
timeout /t 3 /nobreak >nul

echo [2/2] Запуск Frontend сервера...
cd frontend

REM Проверка node_modules
if not exist node_modules (
    echo [ИНФО] Установка зависимостей frontend...
    call npm install
    echo.
)

start "FoodHelper Frontend" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo   Серверы запущены!
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3001
echo.
echo   Нажмите любую клавишу для выхода...
echo   (Окна серверов останутся открытыми)
pause >nul

