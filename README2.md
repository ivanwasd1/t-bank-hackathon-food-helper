# Bentofy

A personalized meal-planning application powered by Gemini AI.

## Setup & Run Locally

You will need two terminals open: one for the Backend (Python) and one for the Frontend (React).

### 1. Configure Environment
Create a `.env` file in the root directory and add your Google Gemini API Key:
```env
VITE_API_KEY=AIzaSy...
```

### 2. Start Backend (Terminal 1)
Make sure you have Python installed.

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run the server
uvicorn backend.main:app --reload --port 8000
```

### 3. Start Frontend (Terminal 2)
Make sure you have Node.js installed.

```bash
# Install dependencies
npm install

# Run the app
npm run dev
```

The app will be available at: **http://localhost:5173**