const { test, expect } = require("@playwright/test");

test("strategy evaluate writes action audit and updates result UI", async ({ page }) => {
  await page.goto("/#/settings");
  await page.locator("#loadDemoDataBtn").click();
  await page.locator("#confirmOkBtn").click();

  await page.goto("/#/strategy");
  await page.locator("#strategyEvaluateBtn").click();
  await expect(page.locator("#strategyResultSummary")).toBeVisible();

  const entry = await page.evaluate(() => {
    const raw = localStorage.getItem("cryptofolio_action_audit_v1") || "[]";
    const rows = JSON.parse(raw);
    return rows.filter(item => item.action === "strategy_evaluate").at(-1) || null;
  });

  expect(entry).not.toBeNull();
  expect(["success", "error"]).toContain(entry.status);
  expect(entry.durationMs).toBeGreaterThanOrEqual(0);
});
