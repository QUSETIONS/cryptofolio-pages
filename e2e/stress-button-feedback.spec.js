const { test, expect } = require("@playwright/test");

test("stress run writes action audit and updates result UI", async ({ page }) => {
  await page.goto("/#/settings");
  await page.locator("#loadDemoDataBtn").click();
  await page.locator("#confirmOkBtn").click();

  await page.goto("/#/stress");
  await page.selectOption("#stressPresetSelect", "risk_off");
  await page.locator("#stressRunBtn").click();
  await expect(page.locator("#stressResultTable table")).toBeVisible();

  const entry = await page.evaluate(() => {
    const raw = localStorage.getItem("cryptofolio_action_audit_v1") || "[]";
    const rows = JSON.parse(raw);
    return rows.filter(item => item.action === "stress_run").at(-1) || null;
  });

  expect(entry).not.toBeNull();
  expect(entry.status).toBe("success");
  expect(entry.durationMs).toBeGreaterThanOrEqual(0);
});
