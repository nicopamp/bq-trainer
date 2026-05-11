import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("unauthenticated user is redirected to /auth from protected page", async ({ browser }) => {
    // Explicitly create a context with no storage state (no session cookies)
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/auth/);
    await ctx.close();
  });

  test("authenticated user is not redirected to /auth from /home", async ({ page }) => {
    await page.goto("/home");
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
