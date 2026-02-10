const { test, expect } = require("@playwright/test");

function buildPayload(windowKey = "30D") {
  const now = Date.now();
  const mk = base => [
    { ts: now - 3 * 24 * 60 * 60 * 1000, value: base },
    { ts: now - 2 * 24 * 60 * 60 * 1000, value: base * 1.02 },
    { ts: now - 1 * 24 * 60 * 60 * 1000, value: base * 1.01 },
    { ts: now, value: base * 1.03 }
  ];
  return {
    window: windowKey,
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
      { id: "crypto_btc", label: "Bitcoin", category: "crypto", source: "Yahoo Finance", points: mk(100000) },
      { id: "equity_sp500", label: "S&P 500", category: "equity", source: "Yahoo Finance", points: mk(5000) },
      { id: "dollar_dxy", label: "US Dollar Index", category: "fx", source: "Yahoo Finance", points: mk(103) },
      { id: "rates_ust10y", label: "US 10Y Yield", category: "rates", source: "Yahoo Finance", points: mk(4.1) },
      { id: "gold_xau", label: "Gold", category: "commodity", source: "Yahoo Finance", points: mk(2050) }
    ]
  };
}

test("macro panel renders and switches window", async ({ page }) => {
  await page.route("**/api/macro-snapshot?window=30D", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildPayload("30D")) })
  );
  await page.route("**/api/macro-snapshot?window=90D", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildPayload("90D")) })
  );

  await page.goto("/");
  await expect(page.locator("#macroRegimeBadge")).toBeVisible();
  await expect(page.locator("#macroScore")).toContainText(/Score|评分|--/);

  await page.click('button[data-macro-window="90D"]');
  await expect(page.locator('button[data-macro-window="90D"]')).toBeVisible();
  await expect(page.locator('button[data-macro-window="90D"]')).toHaveText(/90D/);
});
