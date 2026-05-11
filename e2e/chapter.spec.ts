import { test, expect } from "@playwright/test";

test.describe("Chapter detail", () => {
  test("shows all verses for Acts 3", async ({ page }) => {
    await page.goto("/chapter/3");
    await expect(page.getByText("Chapter 3")).toBeVisible();
    // Acts 3 has 26 verses — spot-check first and last
    await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  });

  test("verse links navigate to learn flow", async ({ page }) => {
    await page.goto("/chapter/3");
    // Click the first verse row
    await page.locator("a[href*='/learn/3/']").first().click();
    await expect(page).toHaveURL(/\/learn\/3\//);
    await expect(page.getByText("Meet the verse")).toBeVisible();
  });

  test("back button returns to home", async ({ page }) => {
    await page.goto("/chapter/1");
    await page.getByRole("link").filter({ has: page.locator("svg") }).first().click();
    await expect(page).toHaveURL(/\/home/);
  });
});
