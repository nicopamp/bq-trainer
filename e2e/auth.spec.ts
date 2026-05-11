import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("unauthenticated root redirects to /auth", async ({ browser }) => {
    // Use a fresh context with no saved auth state
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth/);
    await ctx.close();
  });

  test("authenticated user is not redirected to /auth from /home", async ({ page }) => {
    await page.goto("/home");
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
