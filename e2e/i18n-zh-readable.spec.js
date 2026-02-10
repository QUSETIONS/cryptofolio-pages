const { test, expect } = require("@playwright/test");

test("zh-cn labels are readable (no mojibake) on key navigation texts", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      locale: "zh-CN",
      newsEnabled: true,
      newsPrefsVersion: 2
    }));
  });

  await page.goto("/");
  await expect(page.locator("#topNav")).toContainText(/Overview|总览/);
  await expect(page.locator("h2[data-i18n='hero.title']")).toContainText(/风险决策|risk decision/i);
  await expect(page.locator("#topNav")).not.toContainText(/鏉|璁|锟�|�/);
  await expect(page.locator("#localeQuickToggleBtn")).toHaveText(/EN|中文/);
});
