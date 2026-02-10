const { test, expect } = require("@playwright/test");

test("news module is enabled by default for fresh user state", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto("/#/settings");
  const toggle = page.locator("#newsEnabledToggle");
  await expect(toggle).toBeVisible();
  const before = await toggle.isChecked();
  await toggle.click({ force: true });
  await expect(toggle).toBeChecked({ checked: !before });
});
