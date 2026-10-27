# Groww Discovery Engine

Read these first if you are new to the project:

- **[PRD.md](./PRD.md)** — what the product is, who it is for, what each tab does
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how GitHub, Vercel, Neon, and Groq fit together

Product-research tool for Groww Growth. It reads public conversations about first-time SIPs in India, stores them, and lets you ask questions in a chat. The business metric in mind is the share of first-time mutual fund investors who still have an **active SIP 12 months later**.

Active SIP = at least one successful instalment in the last 30 days.

The engine does **not** recommend funds or stocks, and it does **not** use fear, FOMO, or urgency.

## Stack

- **Next.js** website (Groww green `#00D09C`)
- **Neon** database for reviews and analysis
- **Groq** AI for extract and chat
- **Vercel** live hosting
- **GitHub** private code

## Local run

1. Copy `.env.example` to `.env.local` and add `DATABASE_URL` + `GROQ_API_KEY`.
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3000
5. Overview: Collect → Extract (repeat) → Fill Ask answers → open the Ask chat
