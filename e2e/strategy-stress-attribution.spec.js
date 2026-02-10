const { test, expect } = require("@playwright/test");

test("strategy + stress + attribution flows render actionable outputs", async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem("cryptofolio_assets", JSON.stringify([
      {
        id: 1,
        coinId: "bitcoin",
        amount: 2,
        costPrice: 50000,
        addedAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]));
    localStorage.setItem("cryptofolio_transactions", JSON.stringify([
      {
        id: 1,
        assetId: 1,
        coinId: "bitcoin",
        type: "BUY",
        amount: 2,
        price: 50000,
        fee: 10,
        timestamp: now - 7 * 24 * 60 * 60 * 1000
      }
    ]));
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      locale: "zh-CN",
      newsEnabled: true
    }));
  });

  await page.route("**/simple/price**", route => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bitcoin: { usd: 52000, usd_24h_change: 1.8 },
        ethereum: { usd: 2800, usd_24h_change: -0.6 },
        tether: { usd: 1, usd_24h_change: 0 }
      })
    });
  });

  await page.route("**/api/macro-snapshot?window=*", route => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        window: "30D",
        quality: "fresh",
        updatedAt: Date.now(),
        sources: ["CoinGecko"],
        factors: {
          totalMarketCapUsd: 1,
          totalVolumeUsd: 1,
          marketCapChange24h: 0,
          btcDominance: 50
        },
        series: [
          {
            id: "crypto_btc",
            label: "Bitcoin",
            category: "crypto",
            source: "CoinGecko",
            points: [{ ts: Date.now() - 1000, value: 100 }, { ts: Date.now(), value: 101 }]
          }
        ]
      })
    });
  });

  await page.goto("/#/strategy");
  await expect(page.locator("#strategyEvaluateBtn")).toBeVisible();
  await page.locator("#strategyEvaluateBtn").click();
  await expect(page).toHaveURL(/#\/strategy/);

  await page.goto("/#/stress");
  await expect(page.locator("#stressRunBtn")).toBeVisible();
  await page.locator("#stressRunBtn").click();
  await expect(page).toHaveURL(/#\/stress/);

  await page.goto("/#/attribution");
  await expect(page.locator("#attributionRunBtn")).toBeVisible();
  await page.selectOption("#attributionWindowSelect", "7d");
  await page.locator("#attributionRunBtn").click();
  await expect(page.locator("#attributionWindowSelect")).toHaveValue("7d");
  await expect(page).toHaveURL(/#\/attribution/);
});
