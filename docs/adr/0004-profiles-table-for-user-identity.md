# Profiles table for user identity data

User identity data (full name, quiz category, church) is stored in a dedicated `profiles` table in Postgres rather than in Supabase auth user metadata (`user.user_metadata`).

Auth metadata is an untyped JSON blob with no schema enforcement, no RLS-style access control beyond auth ownership, and no foreign-key relationships. As the app grows to include team features, coach visibility, and richer profile data, the profiles table gives us typed columns, proper constraints, and the ability to join against other tables (e.g. a future `teams` table referencing `profiles.user_id`). The migration cost of moving from auth metadata to a table later would be painful.

The profile row is created by a server action at the end of onboarding (not by a DB trigger), because the row should only exist once the user has actually provided their data. A trigger would insert an empty row that must be immediately updated — wrong semantics for required fields.
