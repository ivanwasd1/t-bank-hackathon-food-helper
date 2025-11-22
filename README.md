# Bentofy

A personalized meal-planning application powered by Gemini AI.

## Quick Start (One Command)

1.  **Linux/Mac**: Run the start script.
    ```bash
    ./start.sh
    ```

2.  **Windows**:
    ```bash
    docker-compose up --build
    ```
    *(Note: You must create a .env file first on Windows, see below)*

## Manual Setup

1.  Create a `.env` file in the root directory:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and paste your Google Gemini API Key.
3.  Run Docker Compose:
    ```bash
    docker-compose up --build
    ```

The app will be available at: **http://localhost:5173**
