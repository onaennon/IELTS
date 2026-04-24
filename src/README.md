# IELTS English Coach

A mobile-first IELTS preparation app with AI scoring, European travel theme, and Traditional Chinese support.

---

## Project Structure

```
ielts-app/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── .gitignore
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── styles/app.css
    ├── api/gemini.js
    ├── data/
    │   ├── words.js
    │   └── prompts.js
    └── components/
        ├── App.jsx
        ├── shared.jsx
        ├── HomePage.jsx
        ├── SettingsScores.jsx
        ├── TypingGame.jsx
        ├── EssayCoach.jsx
        └── WordChallenge.jsx
```

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Gemini API key
```bash
cp .env.example .env
```
Edit .env and set:
```
VITE_GEMINI_API_KEY=your_actual_key_here
```

### 3. Run dev server
```bash
npm run dev
```
Open http://localhost:5173

---

## Deploy to Vercel via GitHub

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ielts-app.git
git push -u origin main
```

### Step 2 — Import in Vercel
1. Go to vercel.com and sign in
2. Click Add New → Project
3. Import your GitHub repository
4. Vercel auto-detects Vite — no config needed

### Step 3 — Add API key in Vercel
1. Go to Settings → Environment Variables
2. Add: VITE_GEMINI_API_KEY = your key
3. Tick: Production, Preview, Development
4. Save

### Step 4 — Deploy
Click Deploy. Every future git push triggers automatic redeployment.

---

## Gemini API Key
Get your key at: https://aistudio.google.com/app/apikey
The app uses gemini-2.0-flash.

---

## Customising the Word List
Edit src/data/words.js — the lists are plain JS arrays.
Add Chinese definitions to the chineseDefinitions object in the same file.

## Customising AI Strictness
Edit src/data/prompts.js — each game mode has its own system prompt.

---

## Environment Variables

| Variable              | Description                        |
|-----------------------|------------------------------------|
| VITE_GEMINI_API_KEY   | Gemini API key from Google AI Studio |

Never commit your .env file. It is already in .gitignore.
