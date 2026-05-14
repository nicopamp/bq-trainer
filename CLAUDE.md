# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Next.js dev server on :3000
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit (no build artifacts)
npm run seed         # fetch Acts 1–9 KJV from bible-api.com and upsert into Supabase
```

To run the seed script you also need `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (in addition to the anon key used at runtime).

## Architecture

**Stack:** Next.js 15 App Router · TypeScript · Supabase (Postgres + Auth) · ts-fsrs · Web Speech API

**Routing layout:**
- `/` → redirects to `/home`
- `/auth` — magic-link sign-in (client component)
- `/auth/callback` — Supabase code-exchange route handler
- `/home` — dashboard: verse heatmap, due-review CTA, streak (server component)
- `/chapter/[id]` — per-chapter verse list with mastery states (server component)
- `/learn/[chapterId]/[verseId]` — full 5-step Learn flow (server shell + `LearnReadClient` client component manages step state locally)
- `/drill` — drill session queue; accepts `?chapter=N` filter (server fetches due verses, passes to `DrillClient`)
- `/progress` — streak, overall progress, chapter breakdown (server component)
- `/settings` — sign-out, preferences (client component)
- `/onboarding` — first-run walkthrough (client component)

**Data flow:**
- Server components fetch from Supabase directly via `lib/supabase/server.ts`
- Client components that mutate (learn steps, drill reviews) call server actions in `lib/actions.ts`
- FSRS scheduling lives in `lib/fsrs.ts` — `scheduleReview(userVerse, rating)` returns fields to persist; `advanceLearnStep(verseId, nextStep)` handles the learn ladder

**Learn flow (5 steps):**
`LearnReadClient` in `app/learn/.../LearnReadClient.tsx` tracks local step state. Each step is a separate inner component (`ReadStep`, `ChunkStep`, `TraceStep`, `RecallStep`, `GraduateStep`). Graduation calls `advanceLearnStep(verseId, 5)` which sets state → `review` and seeds initial FSRS fields.

**Drill modes:** Audio (pick-the-ref multiple choice), Finish-it (speak the rest), Type-out (keyboard), Ref-to-verse (speak from ref). All live in `app/drill/DrillClient.tsx`. Voice grading uses the Web Speech API; fall back to manual grade buttons when unavailable.

**FSRS state machine:**
- `new` → `learning` on first learn step
- `learning` → `review` on graduation
- `review` → `mastered` when `stability > 30 days` and grade ≥ Good
- Any state → `stale` if past due > stability × 1.5 (handled in display logic; DB state unchanged until next review)

**Supabase schema:** `verses` (static KJV text), `user_verses` (per-user FSRS state), `reviews` (audit log), `sessions`, `streaks`. RLS policies restrict all user tables to `auth.uid() = user_id`. A DB trigger auto-creates `user_verses` rows for every verse when a new user signs in.

**KJV text:** Stored in Supabase `verses` table. Seeded once via `npm run seed`. The seed script fetches from `bible-api.com` (public domain). Never fetch at runtime.

**Design system:** All CSS variables are in `app/globals.css`. Key tokens: `--saffron-500` (#c9842c) = primary CTA, `--leaf-500` (#5b6e4f) = mastered/success, `--rust-500` (#a8451f) = due/again/streak. Fonts: Fraunces (display serif), Inter Tight (UI), JetBrains Mono (refs/mono). Use `.t-display`, `.t-mono`, `.eyebrow` utility classes. Avoid inline font-family declarations.

**Voice:** `window.speechSynthesis` for TTS (listen buttons). `SpeechRecognition`/`webkitSpeechRecognition` for voice input. Always gate with capability checks and degrade gracefully (manual grade buttons as fallback). The `useSpeechRecognition` hook wraps a `createSRSession` factory (`lib/speechRecognitionSession.ts`) that creates one SR instance lazily and reuses it — preventing per-tap permission re-prompts. The hook's `useEffect` cleanup calls `destroy()` on unmount to release the mic.

## Environments

Two Supabase projects — one for production, one for preview:

- **Production** (`bq-trainer.bridgeviewchristian.com`): production Supabase project. Vercel "Production" env vars.
- **Preview** (Vercel auto-generated URLs, e.g. `bq-trainer-git-{branch}-nicopamps-projects.vercel.app`): separate Supabase project. Vercel "Preview" env vars.

The preview Supabase has `https://bq-trainer-*-nicopamps-projects.vercel.app/**` in its allowed Redirect URLs so auth flows work across all auto-generated PR preview URLs. There is no fixed preview domain — use the Vercel-generated URL for a given PR.

GitHub Actions secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) exist only for the CI build check and point to production. They do not affect deployments — Vercel's per-environment variables are the source of truth.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`nicopamp/bq-trainer`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root (neither exists yet). See `docs/agents/domain.md`.
