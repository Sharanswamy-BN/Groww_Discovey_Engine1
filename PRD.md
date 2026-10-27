# Product Requirements Document (PRD)

**Product:** Groww Discovery Engine  
**Who it is for:** Groww Growth team, reviewers, and anyone opening the live website  
**Status:** Built and live on Vercel

---

## 1. What this product is (in one minute)

Groww Discovery Engine reads **public customer conversations** about SIPs and first-time investing in India (Play Store, App Store, Reddit, forums, social comments). It stores them, analyses them, and lets anyone **ask questions in a chat**.

The goal is to **discover the real user problem** behind this business metric:

> Increase the share of first-time mutual fund investors who still have an **active SIP 12 months** after starting their first one.

**Active SIP** = at least one successful instalment in the last 30 days.

Starting a SIP is easy. Staying with it is harder. This tool helps a product manager see **why people pause, reduce, or stop**, from real talk, not from a guessed brief.

---

## 2. Who uses it

| User | What they do |
| --- | --- |
| Growth / product manager | Collect reviews, read conversations, ask questions in chat |
| Reviewer / stakeholder | Open the Vercel link and understand findings without GitHub access |
| Engineer | Maintain GitHub, Vercel, Neon, Groq |

The GitHub repo can stay **private**. People should be sent the **Vercel website link**, not the GitHub link.

---

## 3. What the website shows

Three tabs only:

### Overview
- Title: **Groww Discovery Engine**
- Short description of what the engine does
- Counts: total conversations, Play Store, other sources, analysed
- Three buttons to run the engine:
  1. **Collect** — pull public reviews/posts into the database  
  2. **Extract batch** — AI reads a batch of stored texts  
  3. **Fill Ask answers** — AI summarises patterns for later chat  

### Conversation
- Browse stored reviews and posts
- Filter by source (Play Store, App Store, Reddit, etc.)
- Search by words such as SIP, pause, mandate

### Ask
- A **chatbot**
- User types or pastes a question
- If the answer is in the collected reviews, the bot answers from those reviews (AI only cleans the wording)
- If the answer is **not** in the reviews, the bot starts with:

> The requested information was not found in the analyzed reviews. Based on my knowledge, here is the most relevant answer.

  Then it may add a short general answer.

---

## 4. Questions this engine is meant to help answer

Users can ask anything in chat. These are the core research questions:

1. Why do people start a SIP, and what do they expect to happen?  
2. What changes in their behaviour in the months after starting?  
3. What leads investors to pause, reduce or stop a SIP?  
4. What do investors check, and how often, once they have started?  
5. What confuses or worries them inside the app?  
6. What do they do outside the app when they feel unsure?  
7. What separates investors who continue from those who quietly drop off?  
8. How do these patterns differ across user segments?  
9. What unmet needs emerge consistently across conversations?  

---

## 5. Data we want vs what you may see

| Source | Target |
| --- | --- |
| Google Play Store (Groww app) | 8,000–10,000 reviews |
| Other sources together (App Store, Reddit, Trading Q&A, YouTube/social) | about 200–300 |

**No date cutoff.** A review from 1 year or 2 years ago is still kept.

**Important:** Collect on Vercel often **cannot** download thousands of Play Store reviews in one go (time limit + Google blocking cloud servers). If the Overview count is ~40, Ask is answering from those ~40 items, not from 10,000. Click **Collect** again to load more **only if** Play Store numbers go up. If they stay near zero, Play Store scrape is blocked.

---

## 6. Product rules (must follow)

- Do **not** recommend specific funds or stocks.  
- Do **not** use fear, FOMO, or urgency nudges.  
- Chat should prefer **review evidence**. General AI knowledge is only a fallback, and must use the sentence in section 3.  
- Do not put API keys on GitHub. Keys live in `.env.local` (laptop) and Vercel Environment Variables (live site).

---

## 7. What success looks like

| Check | Passes when |
| --- | --- |
| Someone can use the site from a link | Vercel URL opens without GitHub login |
| Discovery is visible | Conversation tab shows real posts |
| Research is usable | Ask chat answers the 9 questions from stored reviews |
| Honesty | If reviews are few, answers are clearly based on that small set |

This product is **Part 1: discovery**. It does not ship a new SIP feature inside the Groww app. It helps find the user problem first.

---

## 8. How to run it (non-technical)

1. Open the live Vercel website.  
2. Overview → **Collect** (repeat if you need more Play Store rows).  
3. **Extract batch** until “Analysed” is close to “Conversations”.  
4. **Fill Ask answers**.  
5. Open **Ask** and type questions.

Needed accounts (already used for this project): **GitHub** (code), **Vercel** (website), **Neon** (database), **Groq** (AI).

---

## 9. Out of scope

- Recommending which mutual fund to buy  
- Scare / FOMO notifications  
- A full Groww consumer app replacement  
- Hidden pages (Sources, Themes, etc. may still exist as old files; the main product is the three tabs)
