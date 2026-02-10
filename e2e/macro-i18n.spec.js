const { test, expect } = require("@playwright/test");

function payload() {
  const now = Date.now();
  return {
    window: "30D",
    quality: "fresh",
    updatedAt: now,
    sources: ["Yahoo Finance", "CoinGecko"],
    factors: {
      totalMarketCapUsd: 3_100_000_000_000,
      totalVolumeUsd: 120_000_000_000,
      marketCapChange24h: 2.1,
      btcDominance: 53.5
    },
    series: [
      {
        id: "crypto_btc",
        label: "Bitcoin",
        category: "crypto",
        source: "Yahoo Finance",
        points: [
          { ts: now - 2_000, value: 100000 },
          { ts: now, value: 103000 }
        ]
      }
    ]
  };
}

test("macro analysis text changes with locale", async ({ page }) => {
  await page.route("**/api/macro-snapshot*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload()) })
  );

  await page.goto("/");
  await expect(page.locator("#macroScore")).toContainText(/Score|评分|--/);

  await page.click('a[data-route-link][href="#/settings"]');
  await page.selectOption("#localeSelect", "zh-CN");
  await expect(page.locator("#localeSelect")).toHaveValue("zh-CN");
  await page.click('a[data-route-link][href="#/dashboard"]');
  await expect(page.locator("#macroScore")).toContainText(/Score|评分|--/);
});
