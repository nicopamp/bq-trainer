# ADR 0006: Security baseline

**Status:** Accepted  
**Date:** 2026-05-15

## Context

As BQ Trainer grows from prototype to production, several low-cost security gaps are worth closing now:

- Server actions trusted their TypeScript types at runtime — a crafted call could supply `grade: 99`, a 10 MB transcript, or an out-of-range chapter number.
- No security headers shipped (no HSTS, X-Frame-Options, CSP, Permissions-Policy).
- `/api/test/sign-in` was gated only by `NODE_ENV !== "production"` — a single misconfiguration could turn it into a credential-spraying surface.
- `/auth/callback` reflected the `next` query parameter directly into a redirect without validation — a latent open redirect.
- RLS policies used `FOR ALL USING (auth.uid() = user_id)` and relied on Postgres falling back from `USING` to `WITH CHECK` implicitly, making intent non-obvious.
- The `verses` table had no write restriction on the `authenticated` role — the public read-only nature was implied, not enforced.
- No SAST, secret scanning, or structured dependency management in CI.

**Threat model: casual abuse and accidental footguns.** BQ Trainer is a hobby app with a small known user base, no payments, and minimal PII (email, name, church, quiz category). We defend against:

- Curious authenticated users poking server actions with out-of-range input.
- Bot abuse of auth surfaces.
- Dependency drift introducing known CVEs.
- Accidental RLS regressions from future migrations.

We are **not** defending against determined attackers, nation-states, or insider threats. This explicitly drives several "no" decisions below.

## Decisions

### 1. Zod validation at every server-action boundary, DB CHECK constraints as backstop

**Accepted over:** DB-only validation (application error messages would be opaque) or app-only validation (no backstop if a future code path bypasses the schema).

Zod schemas live in `lib/actions/schemas.ts`. Each server action calls `schema.parse(input)` as its first line. TypeScript parameter types are inferred with `z.infer<typeof …>` — schema and type stay in sync by construction. DB CHECK constraints mirror the critical invariants (grade range, learn step range, string lengths) so the DB rejects abuse even from code paths that don't go through the server actions.

Key caps: `grade` ∈ {1,2,3,4}; `transcript` ≤ 2000 chars; `durationMs` 0–600 000; `accuracy` 0–1; `nextStep` 0–5; event `name` 1–80 chars; `endChapter` 1–150; profile `fullName` 1–80 chars; `church` 1–120 chars.

### 2. Baseline security headers in `next.config.ts`

Applied to all routes:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: microphone=(self), camera=(), geolocation=(), payment=(), usb=()`

**Accepted over:** individual route-level headers — a single place is easier to audit and less likely to be missed on new routes.

### 3. Content-Security-Policy in Report-Only mode first

**Accepted over:** enforcing CSP on day one.

The codebase uses extensive `style={{…}}` inline styles and Next.js inlines hydration data into `<script>` tags. Enforcing CSP immediately would require `'unsafe-inline'` for both `style-src` and `script-src` (which CSP already needs) or a large refactor. Report-Only mode lets us observe violations across all flows — sign-in, Learn, all four Drill modes including mic + TTS, Progress, Settings — before deciding whether to enforce or loosen.

The `connect-src` directive is built from `NEXT_PUBLIC_SUPABASE_URL` at build time so preview and production each get their own Supabase host. No `report-uri` initially — violations are observable via DevTools console. Flip to `Content-Security-Policy` in a follow-up PR after one quiet week of observation.

### 4. Double-gated test sign-in route (defense in depth over single env check)

**Accepted over:** relying solely on `NODE_ENV !== "production"`.

A single misconfigured environment variable (e.g., `NODE_ENV` not set) would silently open the route. The route now also requires a constant-time match against `E2E_TEST_SECRET` (read from the `x-test-secret` request header). Returns 404 on failure so the endpoint's existence is not acknowledged to unauthorized callers. See issue #65.

### 5. Path-only validation on auth callback redirect (`safeNextPath`)

`lib/auth/safeRedirect.ts` exports `safeNextPath(raw, fallback?)`. It returns the fallback (`/home`) unless `raw` starts with a single `/`, does not start with `//` or `/\`, and is not an absolute URL. Used by `/auth/callback` to prevent the `next` parameter from being used as an open redirect.

### 6. Explicit `USING … WITH CHECK` on every RLS policy; revoke writes on `verses`

**Accepted over:** relying on Postgres implicit fallback.

Every RLS policy on `user_verses`, `reviews`, `sessions`, `streaks`, `events`, and `profiles` is rewritten to `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`. Intent is explicit. `REVOKE INSERT, UPDATE, DELETE ON verses FROM authenticated` enforces the read-only nature of the KJV source table. See issue #63.

### 7. CodeQL + Gitleaks in CI; `npm audit` as non-blocking warning; `SERVICE_ROLE_KEY` guard

**Accepted over:** Semgrep, Snyk, Socket.dev.

At this scale, CodeQL (GitHub-native, free for public repos) and Gitleaks (lightweight secrets scanner) cover the most important classes of bugs (XSS, unsafe redirects, prototype pollution, secret leakage) without adding a paid dependency. `npm audit --audit-level=high` runs as a non-blocking warning so CVEs are surfaced without blocking shipping. A CI step greps `app/ lib/ components/` for `SERVICE_ROLE` and fails on match so the service role key can never be accidentally imported into app code. Dependabot opens weekly grouped PRs (one for prod deps, one for dev, one for Actions).

**Explicitly rejected:** Semgrep (overkill for a hobby project), Snyk/Socket.dev (paid tiers needed for useful signal), DAST, SBOM, commit signing, CSP `report-uri` endpoint.

### 8. No app-side rate limiting

**Accepted over:** Upstash / Vercel KV rate limiting.

Supabase's built-in auth rate limits are sufficient at current scale. Adding KV introduces a paid dependency and operational surface area that is not warranted until the user base grows significantly.

## Manual settings (outside the codebase)

The repo owner must apply the following once at the repository level in GitHub Settings → Code security:

- **Enable Secret scanning** — GitHub's partner-backed scanner catches common secret patterns at push time.
- **Enable Push protection** — Blocks pushes that contain detected secrets before they reach the remote.

These are not automatable via code and are documented here so they are not forgotten. ADR 0006 is the authoritative reminder.

## Related issues

The decisions above were implemented across the following issues on the #61 security baseline PRD:

- #62 — Zod validation at server-action boundaries + DB CHECK constraints
- #63 — Explicit RLS policies (USING + WITH CHECK) + revoke writes on `verses`
- #64 — Baseline security headers (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- #65 — Double-gated `/api/test/sign-in` with `E2E_TEST_SECRET`
- #66 — Safe redirect validation on `/auth/callback`
- #67 — Content-Security-Policy in Report-Only mode
- #68 — CI scanning (CodeQL, Gitleaks, `npm audit`, `SERVICE_ROLE_KEY` guard, Dependabot)
- #69 — This ADR and `SECURITY.md`

## When to revisit

The calculus above changes under any of these conditions:

- **User base grows beyond hobby scale** — add app-side rate limiting (Upstash / Vercel KV), consider WAF.
- **Payments are added** — PCI-DSS scope changes the threat model substantially; engage a security consultant.
- **Multi-tenant features arrive** (coach/team visibility, shared events) — audit every cross-user data path; RLS policies may need to be tenant-aware.
- **An actual abuse incident occurs** — triage the vector, add targeted mitigations, and document learnings in a follow-up ADR.
- **CSP Report-Only produces one quiet week** — flip `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `next.config.ts`.
