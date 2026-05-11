import { test, expect } from "@playwright/test";

test.describe("Home screen", () => {
  test("loads and shows Acts heatmap", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "Acts" })).toBeVisible();
    // Mastery legend
    await expect(page.getByText("Mastery · by verse")).toBeVisible();
    // At least one chapter row
    await expect(page.getByText("Ch. 1")).toBeVisible();
  });

  test("streak chip is visible", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByText("days")).toBeVisible();
  });

  test("nav tabs are present", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("link", { name: "Drill" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Progress" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("chapter link navigates to chapter detail", async ({ page }) => {
    await page.goto("/home");
    await page.getByText("Ch. 1").click();
    await expect(page).toHaveURL(/\/chapter\/1/);
    await expect(page.getByText("Chapter 1")).toBeVisible();
  });
});
