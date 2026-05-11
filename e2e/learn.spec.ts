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

  test("verse reference is shown in the step header", async ({ page }) => {
    await page.goto("/learn/3/6");
    // The header always shows the verse ref (e.g. "3:6")
    await expect(page.getByText("3:6")).toBeVisible();
  });

  test("close button returns to chapter", async ({ page }) => {
    await page.goto("/learn/3/6");
    await page.locator("a[href='/chapter/3']").click();
    await expect(page).toHaveURL(/\/chapter\/3/);
  });
});
