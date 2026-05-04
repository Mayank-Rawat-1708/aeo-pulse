# AEO Pulse 🔍

> **Answer Engine Optimization** — See how GPT-4o, Claude 3, and Gemini rank your brand in AI search results before your competitors do.

Built for the Pixii.ai Founding Engineer take-home assignment.

## What It Does

1. User types a shopper query: *"best magnesium supplement for seniors"*
2. AEO Pulse queries **GPT-4o**, **Claude 3 Haiku**, and **Gemini 1.5 Flash** simultaneously
3. Extracts all brand mentions, ranks them by frequency per engine
4. Computes a **Visibility Score (0–100)** for your brand across each engine
5. Generates a **Report Card** with a leaderboard + actionable AEO recommendations

## Why AEO Matters

AI search engines (ChatGPT, Claude, Gemini) are replacing traditional Google search for product discovery. If your brand isn't mentioned in their answers, you're invisible to a growing segment of shoppers. AEO Pulse measures exactly that gap.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Framer Motion |
| Backend | Node.js, Express |
| AI APIs | OpenAI GPT-4o-mini, Anthropic Claude 3 Haiku, Google Gemini 1.5 Flash |
| Deploy | Vercel (frontend), Railway (backend) |

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env
# Add your API keys to .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
PORT=3001
```

**Frontend `.env.local`:**
```
VITE_API_URL=https://your-railway-backend.railway.app
```

## Deployment

### Deploy Backend → Railway
1. Push to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Set environment variables in Railway dashboard
4. Backend URL will be something like `https://aeo-pulse-backend.railway.app`

### Deploy Frontend → Vercel
1. Connect repo to [Vercel](https://vercel.com)
2. Set `VITE_API_URL` to your Railway backend URL
3. Deploy

## Features

- **Live engine status** — watch each AI light up as it responds
- **Visibility Score rings** — animated 0-100 score per engine with letter grade
- **Brand Leaderboard** — which brands dominate AI search for your category
- **Sentiment Analysis** — is the AI's tone positive, neutral, or negative?
- **Expandable Responses** — read the full AI response per engine
- **AEO Recommendations** — personalized advice based on your score
- **Example queries** — one-click to populate the form

## Architecture

```
User → React Frontend → Express Backend → [GPT-4o, Claude 3, Gemini 1.5] (parallel)
                                        ↓
                              Brand Extraction + Scoring
                                        ↓
                              JSON Response → Report Card UI
```

## If I Had More Time

- Add Perplexity API as a 4th engine
- Historical tracking — chart your AEO score over time
- Competitor comparison mode — analyze 5 brands side by side
- CSV export of the leaderboard
- Email alerts when your ranking drops
- More sophisticated NLP for brand extraction (spaCy-style entity recognition)

---

Built by Mayank Rawat · NSUT Delhi · [GitHub](https://github.com/Mayank-Rawat-1708)
