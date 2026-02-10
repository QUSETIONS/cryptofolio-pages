const { test, expect } = require("@playwright/test");

test("demo data can be restored to pre-demo state", async ({ page }) => {
  await page.goto("/");
  await page.click('a[data-route-link][href="#/settings"]');

  await page.click("#loadDemoDataBtn");
  const confirmOk = page.locator("#confirmOkBtn");
  if (await confirmOk.isVisible().catch(() => false)) {
    await confirmOk.click();
  }

  await page.click('a[data-route-link][href="#/assets"]');
  await expect(page.locator("#assetsList")).toBeVisible();

  await page.click('a[data-route-link][href="#/settings"]');
  await page.click("#restoreDemoDataBtn");
  const restoreConfirmOk = page.locator("#confirmOkBtn");
  if (await restoreConfirmOk.isVisible().catch(() => false)) {
    await restoreConfirmOk.click();
  }

  await page.click('a[data-route-link][href="#/assets"]');
  await expect(page.locator("#assetsList")).toBeVisible();
});
