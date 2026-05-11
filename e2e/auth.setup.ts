/**
 * Signs in the test user by setting Supabase session cookies directly in the
 * Playwright browser context. No dev-server route needed — signs in via the
 * Node.js Supabase client, then injects the cookie that @supabase/ssr reads.
 */
import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_EMAIL, TEST_PASSWORD } from "./constants";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

setup("sign in", async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Sign in from Node.js to get the session tokens
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error(`Supabase sign-in failed: ${error?.message}`);
  }

  // @supabase/ssr stores the session under key "sb-{projectRef}-auth-token".
  // The client exposes the computed key directly.
  const storageKey = (client.auth as any).storageKey as string;
  const sessionJson = JSON.stringify(data.session);

  // Inject the cookie into the browser context.
  // Session is ~2 KB so no chunking required (MAX_CHUNK_SIZE = 3180).
  await page.context().addCookies([
    {
      name: storageKey,
      value: sessionJson,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Confirm the session is recognised before saving state
  await page.goto("/home");
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
