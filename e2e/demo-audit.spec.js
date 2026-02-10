const { test, expect } = require("@playwright/test");

test("demo audit updates after load and restore", async ({ page }) => {
  await page.goto("/");
  await page.click('a[data-route-link][href="#/settings"]');

  const auditMeta = page.locator("#demoAuditMeta");
  await expect(auditMeta).toHaveCount(1);
  const before = await auditMeta.textContent();

  await page.click("#loadDemoDataBtn");
  const confirmOk = page.locator("#confirmOkBtn");
  if (await confirmOk.isVisible().catch(() => false)) {
    await confirmOk.click();
  }

  await page.click("#restoreDemoDataBtn");
  const restoreConfirmOk = page.locator("#confirmOkBtn");
  if (await restoreConfirmOk.isVisible().catch(() => false)) {
    await restoreConfirmOk.click();
  }

  await expect
    .poll(async () => (await auditMeta.textContent()) || "")
    .toMatch(/Demo audit|审计/i);

  const after = await auditMeta.textContent();
  expect((after || "").length).toBeGreaterThan(0);
  expect(after).toMatch(/Demo audit|审计/i);
  expect(after).not.toEqual(before);
});
