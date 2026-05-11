/**
 * Signs in the test user via the dev-only /api/test/sign-in route,
 * then saves the resulting auth cookies so all tests start authenticated.
 */
import { test as setup, expect } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "./global.setup";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

setup("sign in", async ({ page, request }) => {
  // POST to our dev-only sign-in route — sets the Supabase session cookies
  const res = await request.post("/api/test/sign-in", {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Sign-in failed (${res.status()}): ${body}`);
  }

  // Navigate to home so the page context picks up the cookies the request set
  await page.goto("/home");
  await expect(page).not.toHaveURL(/\/auth/);

  // Save the cookie/storage state for all subsequent tests
  await page.context().storageState({ path: AUTH_FILE });
});
