FROM node:18-alpine

WORKDIR /app

# Копирование package.json и установка зависимостей
COPY package.json .
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Установка serve для раздачи статики
RUN npm install -g serve

# Запуск приложения
CMD ["serve", "-s", "dist", "-l", "5173"]