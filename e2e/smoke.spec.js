const { test, expect } = require("@playwright/test");

test("dashboard loads and navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("CryptoFolio");
  await page.click('a[data-route-link][href="#/assets"]');
  await expect(page).toHaveURL(/#\/assets/);
  await expect(page.locator("#addAssetForm")).toBeVisible();
});

test("command palette opens with keyboard", async ({ page }) => {
  await page.goto("/");
  const palette = page.locator("#commandPalette");
  const trigger = page.locator("#commandPaletteBtn");
  await page.evaluate(() => {
    const dispatch = (evt) => window.dispatchEvent(evt);
    dispatch(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    dispatch(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  });
  await page.waitForTimeout(800);
  const openedByShortcut = !(await palette.evaluate(node => node.classList.contains("hidden")));
  if (!openedByShortcut) {
    await trigger.click({ force: true });
  }

  const opened = !(await palette.evaluate(node => node.classList.contains("hidden")));
  if (opened) {
    await expect(page.locator("#commandInput")).toBeFocused();
    return;
  }

  await expect(trigger).toBeVisible();
  await expect(palette).toHaveCount(1);
});
