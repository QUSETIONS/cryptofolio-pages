const { test, expect } = require("@playwright/test");

test("language switch and demo data flow", async ({ page }) => {
  await page.goto("/");
  await page.click('a[data-route-link][href="#/settings"]');
  await expect(page).toHaveURL(/#\/settings/);

  await expect(page.locator("#localeSelect")).toBeVisible();
  await page.selectOption("#localeSelect", "zh-CN");
  await expect(page.locator("#localeSelect")).toHaveValue("zh-CN");
  await expect(page.locator(".settings-section h3")).toContainText(/设置|Settings/);

  await page.click("#loadDemoDataBtn");
  const confirmOk = page.locator("#confirmOkBtn");
  if (await confirmOk.isVisible().catch(() => false)) {
    await confirmOk.click();
  }

  await page.click('a[data-route-link][href="#/dashboard"]');
  await expect(page.locator("#heroAssetCount")).toBeVisible();
  await expect(page.locator("#totalValue")).toBeVisible();

  await page.click('a[data-route-link][href="#/settings"]');
  await page.selectOption("#localeSelect", "en-US");
  await expect(page.locator("#localeSelect")).toHaveValue("en-US");
  await expect(page.locator('a[data-route-link][href="#/dashboard"]')).toContainText(/Dashboard|总览/);
});
