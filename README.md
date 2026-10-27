# Groww SIP Discovery Engine

Product-research tool for Groww Growth. It reads **live** public conversations from the **last 6 months** about first-time SIPs in India, extracts themes with Groq, and ranks opportunity areas that could raise the share of first-time mutual fund investors who still have an **active SIP 12 months later**.

Active SIP = at least one successful instalment in the last 30 days.

The engine does **not** recommend funds or stocks, and it does **not** use fear, FOMO, or urgency.

## Stack

- **Next.js** UI (Groww green `#00D09C`)
- **Neon** Postgres for conversations, themes, opportunities, evidence log
- **Groq** for extraction, clustering, scoring, and QA
- **Vercel** for hosting
- **GitHub** for source

## Local run

1. Copy `.env.example` to `.env.local` and add `DATABASE_URL` + `GROQ_API_KEY`.
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3000
5. Collect → Extract (repeat) → Themes & opportunities

Step-by-step account setup is on `/setup`.

## What it answers

- Why people start a SIP, and what they expect
- What changes after they start
- What leads to pause / reduce / stop
- What they check, and how often
- In-app confusion vs what they do outside the app
- Continuers vs quiet drop-off
- Segment differences
- Recurring unmet needs

See **Evidence log** in the app for how insights were generated and checked.
