# Security Policy

## Supported versions

Only the latest commit on `main` is supported. No backport patches are issued for older versions.

## Reporting a vulnerability

Use GitHub's **[Report a vulnerability](https://github.com/nicopamp/bq-trainer/security/advisories/new)** private disclosure flow (Security tab → "Report a vulnerability"). This keeps the report confidential until a fix is available.

Please do **not** open a public issue for security vulnerabilities.

If the GitHub flow is unavailable, email **nico.pampaloni@gmail.com** with "SECURITY" in the subject line.

**Expected response time:** Best-effort. This is a hobby project with no SLA. Typical turnaround is a few days for acknowledged issues; complex issues may take longer.

## Scope

**In scope:**

- Bugs in the BQ Trainer application code (`app/`, `lib/`, `components/`, database migrations).
- Vulnerabilities that allow privilege escalation, cross-user data access, or authentication bypass.
- Open redirects in the auth callback or similar surfaces.

**Out of scope:**

- Third-party services: Supabase, Vercel, Cloudflare, GitHub. Report those directly to the relevant vendor.
- Social engineering and phishing.
- Physical attacks.
- Denial-of-service attacks that do not result in data exposure or authentication bypass.
- Issues in dependencies not yet patched upstream (report to the upstream maintainer first; link the upstream report in your disclosure).
