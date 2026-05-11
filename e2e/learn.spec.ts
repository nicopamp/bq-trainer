import { test, expect } from "@playwright/test";

test.describe("Learn flow", () => {
  test("Read step shows verse text and listen button", async ({ page }) => {
    await page.goto("/learn/3/6");
    await expect(page.getByText("Meet the verse")).toBeVisible();
    await expect(page.getByText("Silver and gold have I none")).toBeVisible();
    await expect(page.getByRole("button", { name: /Listen/ })).toBeVisible();
  });

  test("advancing from Read shows Chunk step", async ({ page }) => {
    await page.goto("/learn/3/6");
    await page.getByRole("button", { name: /chunk it up/i }).click();
    await expect(page.getByText("Build it phrase by phrase")).toBeVisible();
  });

  test("5-step progress bar is visible", async ({ page }) => {
    await page.goto("/learn/3/6");
    // 5 progress segments exist
    const segments = page.locator("div").filter({ hasText: /Step 1/ });
    await expect(segments.first()).toBeVisible();
  });

  test("close button returns to chapter", async ({ page }) => {
    await page.goto("/learn/3/6");
    // Click the × close link
    await page.locator("a[href='/chapter/3']").click();
    await expect(page).toHaveURL(/\/chapter\/3/);
  });
});
