const { test, expect } = require("@playwright/test");

test("desktop pet can open menu and jump to news", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await expect(page.locator("#desktopPet")).toBeVisible();
  await page.locator("#desktopPetBody").click({ force: true });
  await expect(page.locator("#desktopPetMenu")).toBeVisible();

  await page.locator("#desktopPetMenu button[data-pet-action='news']").click();
  await expect(page).toHaveURL(/#\/news/);
});
