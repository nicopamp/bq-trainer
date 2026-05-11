/**
 * Runs once before all tests. Creates (or resets) a test user in Supabase
 * using the service role admin API so we have valid credentials to sign in with.
 */
import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_EMAIL, TEST_PASSWORD } from "./constants";

setup("create test user", async () => {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Delete any existing test user so we start clean
  const { data: { users } } = await admin.auth.admin.listUsers();
  const existing = users.find((u) => u.email === TEST_EMAIL);
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id);
  }

  // Create a fresh test user with email already confirmed
  const { error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);
});
