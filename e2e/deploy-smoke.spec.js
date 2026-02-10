const { test, expect } = require("@playwright/test");

const publicBaseUrl = process.env.PUBLIC_BASE_URL;
const isCi = process.env.CI === "true";

test.describe.configure({ mode: "serial" });

test.describe("public deploy smoke", () => {
  async function gotoWithRetry(page, url, attempts = 3) {
    let lastError = null;
    for (let i = 0; i < attempts; i += 1) {
      try {
        await page.goto(url, { waitUntil: "load", timeout: 20_000 });
        return;
      } catch (error) {
        lastError = error;
        if (i < attempts - 1) {
          await page.waitForTimeout(1000);
        }
      }
    }
    throw lastError;
  }

  test.beforeAll(() => {
    if (isCi && !publicBaseUrl) {
      throw new Error("PUBLIC_BASE_URL must be configured in CI for deploy smoke.");
    }
  });

  test("public URL is reachable", async ({ page }) => {
    test.skip(!publicBaseUrl, "PUBLIC_BASE_URL is not configured.");
    await gotoWithRetry(page, publicBaseUrl);
    await expect(page.locator("h1")).toContainText("CryptoFolio");
    await expect(page.locator("#topNav")).toBeVisible();
  });

  test("open bridge, status page, and health API are reachable", async ({ page, request }) => {
    test.skip(!publicBaseUrl, "PUBLIC_BASE_URL is not configured.");
    const openResponse = await request.get(`${publicBaseUrl}/open`);
    expect(openResponse.status()).toBe(200);

    await gotoWithRetry(page, `${publicBaseUrl}/status`);
    await expect(page.locator("h1")).toContainText("CryptoFolio Status");
    await expect(page.locator("#overall")).toBeVisible();
    await expect(page.locator("#serviceList")).toBeVisible();

    const healthResponse = await request.get(`${publicBaseUrl}/api/health`);
    expect([200, 503]).toContain(healthResponse.status());
    const body = await healthResponse.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("services");
  });
});
