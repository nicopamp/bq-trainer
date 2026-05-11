# BQ Trainer

Bible memorization app using spaced repetition (FSRS). Covers Acts 1–9 (KJV) with a 5-step learn flow and four drill modes: audio, finish-it, type-out, and ref-to-verse.

**Stack:** Next.js 15 · TypeScript · Supabase · ts-fsrs · Web Speech API

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

---

## Local setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and keys. All three values are required:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, "service_role" key (seed script only) |

**3. Apply database migrations**

Run the SQL files in `supabase/migrations/` in order against your Supabase project (SQL editor or `psql`).

**4. Seed verse data**

```bash
npm run seed
```

Fetches Acts 1–9 from bible-api.com and upserts ~336 KJV verses into the `verses` table. Only needs to run once.

**5. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # TypeScript, no emit
npm run seed         # seed verse data (requires SUPABASE_SERVICE_ROLE_KEY)
npm run test:e2e     # Playwright end-to-end tests
npm run test:e2e:ui  # Playwright UI mode
```

---

## Deploying to Vercel

1. Push to GitHub and import the repo in the [Vercel dashboard](https://vercel.com/new).
2. Add these environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` — your production URL, e.g. `https://your-app.vercel.app`
3. Deploy. Vercel detects Next.js automatically — no extra config needed.

> `SUPABASE_SERVICE_ROLE_KEY` is only needed for the seed script and should not be set in the Vercel environment.

---

## Project structure

```
app/          Next.js App Router routes
components/   Shared UI components
lib/
  actions.ts  Server actions (drill grading, learn progression)
  fsrs.ts     FSRS-4.5 scheduling logic
  chunking.ts Verse chunking utility
  supabase/   DB clients and TypeScript types
supabase/
  migrations/ SQL schema and migrations
e2e/          Playwright end-to-end tests
```
