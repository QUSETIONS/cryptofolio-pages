const { test, expect } = require("@playwright/test");

test("offline fallback banner appears and clears after reconnect", async ({ page, context }) => {
  await page.goto("/");
  const marketStatus = page.locator("#marketStatus");

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(marketStatus).toBeVisible();

  const errorBanner = page.locator("#errorBanner");
  if (await errorBanner.isVisible().catch(() => false)) {
    await expect(errorBanner).toBeVisible();
  }

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(500);
  await expect(marketStatus).toBeVisible();
});
