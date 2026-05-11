import { test, expect } from "@playwright/test";

test.describe("Chapter detail", () => {
  test("shows chapter heading for Acts 3", async ({ page }) => {
    await page.goto("/chapter/3");
    // Use exact text to avoid matching the "Drill chapter 3" button
    await expect(page.getByText("Chapter 3", { exact: true })).toBeVisible();
  });

  test("verse links navigate to learn flow", async ({ page }) => {
    await page.goto("/chapter/3");
    await page.locator("a[href*='/learn/3/']").first().click();
    await expect(page).toHaveURL(/\/learn\/3\//);
    await expect(page.getByText("Meet the verse")).toBeVisible();
  });

  test("back button returns to home", async ({ page }) => {
    await page.goto("/chapter/1");
    await page.locator("a[href='/home']").click();
    await expect(page).toHaveURL(/\/home/);
  });
});
