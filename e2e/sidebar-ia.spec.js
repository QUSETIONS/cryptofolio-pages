const { test, expect } = require("@playwright/test");

test("sidebar intelligence and lab routes are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await page.click("a[data-route-link='macro']");
  await expect(page).toHaveURL(/#\/macro/);
  await expect(page.locator(".macro-section")).toBeVisible();

  await page.click("a[data-route-link='calendar']");
  await expect(page).toHaveURL(/#\/calendar/);
  await expect(page.locator(".calendar-section")).toBeVisible();

  await page.click("a[data-route-link='decision']");
  await expect(page).toHaveURL(/#\/decision/);
  await expect(page.locator(".decision-section")).toBeVisible();

  await page.click("a[data-route-link='stress']");
  await expect(page).toHaveURL(/#\/stress/);
  await expect(page.locator(".stress-section")).toBeVisible();
});
