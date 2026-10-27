# Architecture (simple)

**Product:** Groww Discovery Engine  
This note explains **how the website is put together**, in plain language.

---

## 1. Big picture

Four services work together:

| Name | Role | Everyday analogy |
| --- | --- | --- |
| **GitHub** | Stores the code (private repo is fine) | The recipe book |
| **Vercel** | Runs the website and gives you a public link | The restaurant |
| **Neon** | Database — saves reviews, analysis, chat evidence | The filing cabinet |
| **Groq** | AI — reads reviews and writes clear answers | The analyst |

People who only need to **see the product** use the **Vercel link**. They do not need GitHub.

```
User browser
    → Vercel (website + APIs)
         → Neon (reviews and analysis)
         → Groq (AI)
    Public sites (Play Store, App Store, Reddit, …)
         → Vercel Collect button pulls them into Neon
```

---

## 2. What you see in the browser

The site is a **Next.js** app (React). Look and colours follow Groww (green `#00D09C`, grey text `#44475B`, white background).

| Page | URL | Job |
| --- | --- | --- |
| Overview | `/` | Title, counts, Collect / Extract / Fill Ask |
| Conversation | `/conversations` | List and search stored reviews |
| Ask | `/ask` | Chatbot |

Header name: **Groww Discovery engine**.

---

## 3. What happens when you click the three buttons

### 1. Collect (`POST /api/ingest`)
- Tries to download **Play Store** reviews for the Groww Android app (`com.nextbillion.groww`) in **batches** (not 10,000 at once).  
- Also pulls a smaller mix: **App Store**, **Reddit** (India investing communities), **Trading Q&A-style** threads, **YouTube** comments if a YouTube key exists.  
- Saves each item in Neon table `documents`.  
- Same text is not saved twice (hash of source + text).  
- **No “only last 6 months” filter.** Any year is allowed.

### 2. Extract (`POST /api/extract`)
- Picks documents that are not analysed yet.  
- Sends each one to **Groq**.  
- Groq returns structured notes: is this about SIP? why they started, pause reasons, what they check, confusion in the app, and so on.  
- Saved in `document_analyses`.  
- One click only does a **batch** (about 20). Click again until Analysed ≈ Conversations.

### 3. Fill Ask answers (`POST /api/synthesize`)
- Groups themes, scores opportunity areas, writes draft answers to the research questions.  
- Saved in `themes`, `opportunities`, `discovery_answers`, `evidence_log`.  
- Helps the chat, but the **Ask tab** also reads raw reviews directly.

### Ask chat (`POST /api/ask`)
- User message goes to Groq with the **closest matching stored reviews**.  
- If reviews are enough → answer from reviews.  
- If not → answer starts with the fixed “not found in analyzed reviews…” line, then general knowledge.

Other APIs: `GET /api/status` (counts), `GET /api/data` (lists for Conversation).

---

## 4. Database (Neon) — main tables

| Table | What it holds |
| --- | --- |
| `documents` | Raw reviews / posts |
| `document_analyses` | AI notes per document |
| `themes` | Grouped topics |
| `opportunities` | Ranked problem spaces |
| `discovery_answers` | Written answers to research questions |
| `evidence_log` | How data was collected and checked |
| `pipeline_runs` | Each Collect / run |
| `ingest_cursors` | “Where we left off” for Play Store paging |

Tables are created automatically on first use. You do not create them by hand.

---

## 5. Secrets (never put these in GitHub)

| Variable | Where | What |
| --- | --- | --- |
| `DATABASE_URL` | `.env.local` and Vercel | Neon connection string |
| `GROQ_API_KEY` | `.env.local` and Vercel | Groq AI key |
| `YOUTUBE_API_KEY` | optional | YouTube comments |

`.env.local` is git-ignored.

---

## 6. Folders in the code (if you open GitHub)

```
src/app/page.tsx              Overview
src/app/conversations/        Conversation tab
src/app/ask/                  Chat UI
src/app/api/ingest/           Collect
src/app/api/extract/          Extract
src/app/api/synthesize/       Fill Ask answers
src/app/api/ask/              Chat backend
src/lib/ingest.ts             How reviews are fetched
src/lib/analyze.ts            Groq extract + chat
src/lib/db.ts                 Neon + table setup
src/components/AppShell.tsx   Header and 3 tabs
```

Older pages (themes, setup, …) may still exist in the repo. They are **not** in the main navigation.

---

## 7. Limits reviewers should know

- **Vercel** functions have a short time limit. Collect cannot load 10,000 Play Store reviews in one click.  
- **Google** often blocks Play Store scraping from cloud IPs, so the live site may only keep App Store + Reddit (sometimes ~40 items).  
- **Groq** is used per extract and per chat message (quota / cost).  
- Chat quality = quality and **count** of rows in `documents`.

---

## 8. How a change goes live

1. Edit code on the laptop.  
2. `git push` to GitHub `main`.  
3. Vercel rebuilds automatically.  
4. Open the production `.vercel.app` URL (not a random preview URL that asks for Vercel login).

If the site asks for Vercel login, turn off **Deployment Protection** for Production in Vercel settings so reviewers can open the link.
