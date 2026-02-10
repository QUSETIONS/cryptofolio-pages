const { test, expect } = require("@playwright/test");

test("ui should not expose template placeholders", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      locale: "zh-CN",
      newsEnabled: true,
      newsPrefsVersion: 2
    }));
  });

  await page.goto("/#/strategy");
  const strategyText = await page.locator("body").innerText();
  expect(strategyText.includes("{{")).toBe(false);
  expect(strategyText.includes("}}")).toBe(false);

  await page.goto("/#/stress");
  const stressText = await page.locator("body").innerText();
  expect(stressText.includes("{{")).toBe(false);
  expect(stressText.includes("}}")).toBe(false);
});
