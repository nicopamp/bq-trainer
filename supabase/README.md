# Supabase setup

Run these three migration files in order in the **SQL editor** of any new Supabase project.

## Order

| File | What it does |
|------|-------------|
| `migrations/0001_schema.sql` | Creates all tables and indexes |
| `migrations/0002_rls.sql` | Enables RLS and adds per-user policies |
| `migrations/0003_triggers.sql` | Auto-provisions `user_verses` + `streaks` on new user sign-up |

Then seed the verse text:

```bash
npm run seed
```

## Auth settings (do for every project)

1. **Authentication → URL Configuration**
   - Site URL: your app URL (e.g. `https://bq-trainer.vercel.app`)
   - Redirect URLs: add `https://your-domain.com/auth/callback`

2. **Authentication → Providers → Email**
   - Enable email provider ✓
   - Confirm email ✓ (keep on)

3. **Project Settings → Authentication → SMTP**
   - Configure Resend (or another provider) to avoid Supabase's 3/hr rate limit
   - Host: `smtp.resend.com`, Port: `465`, Username: `resend`, Password: your Resend API key
   - Sender: a verified domain address

## Staging vs production

The repo uses two separate Supabase projects:

- **Production**: env vars set under "Production" in Vercel
- **Staging**: env vars set under "Preview" in Vercel — points at the staging project

Run all three migrations + `npm run seed` on both projects.
