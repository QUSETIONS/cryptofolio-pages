import { test, expect } from "@playwright/test";

test.describe("status news observability", () => {
  test("status page shows news crawl metrics", async ({ page }) => {
    await page.goto("/status", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "News Snapshot" })).toBeVisible();
    await expect(page.getByText("Crawl Count")).toBeVisible();
    await expect(page.getByText("Crawl As-Of")).toBeVisible();
    await expect(page.getByText("Last Error")).toBeVisible();
  });
});
