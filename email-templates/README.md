# Email Templates

HTML email templates for Bible Quiz Trainer's transactional emails. These are stored in the repo for version control and review. The final step — pasting them into Supabase — is a manual human action.

## Templates

| File | Purpose | Supabase Template Name |
|------|---------|------------------------|
| `magic-link.html` | Sign-in via magic link | **Confirm signup** / **Magic Link** |
| `password-reset.html` | Password reset flow | **Reset Password** |

## How to paste into Supabase

1. Go to your Supabase project dashboard → **Authentication** → **Email Templates**.
2. Select the template you want to update from the left sidebar.
3. Copy the full contents of the corresponding `.html` file in this directory.
4. Paste into the **Body** editor, replacing the default template.
5. Click **Save**.
6. Send a test email to verify rendering.

Repeat for each environment (production and preview each have a separate Supabase project).

## Template variables

Both templates use the following Supabase-provided variable:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The full one-time URL for the action (sign-in link or password reset link). Supabase substitutes this at send time. |

## Design notes

- **Inline styles only** — no `<style>` block or external stylesheets. Email clients (especially Outlook) strip non-inline CSS.
- **No web fonts** — `Georgia, 'Times New Roman', serif` is used throughout. Web fonts don't render reliably across email clients.
- **SVG logo mark** — the BQT mark is an inline `<svg>` with hard-coded hex colors (no CSS variables). SVG renders in Gmail, Apple Mail, and most modern clients; Outlook 2013/2016 on Windows will fall back to a blank space, which is acceptable.
- **Color palette** matches the app: background `#f6efe0`, card `#fbf6ea`, border `#efe6cf`, primary CTA `#c9842c` (saffron), link fallback color `#c9842c`.
- **Max width 520px** — fits comfortably on mobile and desktop email clients.
- **Table-based layout** — required for Outlook compatibility.

## localStorage keys (for reference)

All `localStorage` keys used by the app are collected here to avoid collisions:

| Key | Used by | Purpose |
|-----|---------|---------|
| `bqt_daily_goal` | Settings | User's daily review goal |
| `bqt_drill_order` | Settings | Preferred drill mode order |
| `bqt_optimistic_states` | HeatmapRows, LearnReadClient | Optimistic verse-state patch applied before server data arrives on the home page |
