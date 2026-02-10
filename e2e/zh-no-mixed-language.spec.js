const { test, expect } = require("@playwright/test");

test("zh-cn pages show Chinese titles for strategy/stress/attribution", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      locale: "zh-CN",
      newsEnabled: true,
      newsPrefsVersion: 2
    }));
  });

  await page.goto("/#/strategy");
  await expect(page.locator("h3[data-i18n='strategy.title']")).toHaveText("策略实验室");

  await page.goto("/#/stress");
  await expect(page.locator("h3[data-i18n='stress.title']")).toHaveText("压力测试");

  await page.goto("/#/attribution");
  await expect(page.locator("h3[data-i18n='attribution.title']")).toHaveText("风险归因");
});
