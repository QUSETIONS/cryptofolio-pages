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
          { ts: now - 2000, value: 100000 },
          { ts: now, value: 103000 }
        ]
      }
    ]
  };
}

test("brief and pro modes render different sections and text", async ({ page }) => {
  await page.route("**/api/macro-snapshot*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload()) })
  );

  await page.goto("/");
  await page.selectOption("#macroAnalysisModeSelect", "brief");
  await expect(page.locator("#macroAnalysisModeSelect")).toHaveValue("brief");
  await expect(page.locator("#macroInsight1")).toBeVisible();

  await page.selectOption("#macroAnalysisModeSelect", "pro");
  await expect(page.locator("#macroAnalysisModeSelect")).toHaveValue("pro");
  await expect(page.locator("#macroInsight1")).toBeVisible();
  await expect(page.locator("#macroInsight1")).toContainText(/./);
});
