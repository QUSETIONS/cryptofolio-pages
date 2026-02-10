const { test, expect } = require("@playwright/test");

test("sidebar can navigate and collapse on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await expect(page.locator("#appShell")).not.toHaveClass(/nav-collapsed/);
  await page.click("#navCollapseBtn");
  await expect(page.locator("#appShell")).toHaveClass(/nav-collapsed/);

  await page.click("a[data-route-link='strategy']");
  await expect(page).toHaveURL(/#\/strategy/);
  await expect(page.locator("a[data-route-link='strategy']")).toHaveClass(/active/);
});

test("sidebar works as drawer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator("#appShell")).not.toHaveClass(/nav-open-mobile/);
  await page.click("#navCollapseBtn");
  await expect(page.locator("#appShell")).toHaveClass(/nav-open-mobile/);

  await page.click("#sideNavOverlay", { force: true });
  await expect(page.locator("#appShell")).not.toHaveClass(/nav-open-mobile/);
});
