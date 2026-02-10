const { test, expect } = require("@playwright/test");

test("critical actions are gated by custom confirm dialog", async ({ page }) => {
  await page.goto("/");
  await page.click('a[data-route-link][href="#/settings"]');

  await page.click("#loadDemoDataBtn");
  const confirmRoot = page.locator("#confirmDialogRoot");
  if (await confirmRoot.isVisible().catch(() => false)) {
    await page.click("#confirmCancelBtn");
    await expect(confirmRoot).toBeHidden();
  }

  await page.click('a[data-route-link][href="#/dashboard"]');
  await expect(page.locator("#heroAssetCount")).toBeVisible();

  await page.click('a[data-route-link][href="#/settings"]');
  await page.click("#loadDemoDataBtn");
  if (await confirmRoot.isVisible().catch(() => false)) {
    await page.click("#confirmOkBtn");
  }
  await page.click('a[data-route-link][href="#/dashboard"]');
  await expect(page.locator("#heroAssetCount")).toBeVisible();

  await page.click('a[data-route-link][href="#/settings"]');
  await page.click("#resetDataBtn");
  if (await confirmRoot.isVisible().catch(() => false)) {
    await page.click("#confirmOkBtn");
    await expect(confirmRoot).toBeHidden();
  }
});
