const { test, expect } = require("@playwright/test");

test("macro module falls back to cached snapshot when API fails", async ({ page }) => {
  const now = Date.now();
  const cachedPayload = {
    window: "30D",
    quality: "delayed",
    updatedAt: now - 60_000,
    sources: ["CachedSource"],
    factors: {
      totalMarketCapUsd: 2_000_000_000_000,
      totalVolumeUsd: 50_000_000_000,
      marketCapChange24h: -0.5,
      btcDominance: 57
    },
    series: [
      {
        id: "crypto_btc",
        label: "Bitcoin",
        category: "crypto",
        source: "CachedSource",
        points: [
          { ts: now - 2_000, value: 90000 },
          { ts: now, value: 90500 }
        ]
      }
    ]
  };

  await page.addInitScript(payload => {
    localStorage.setItem("cryptofolio_macro_snapshot_cache_v2", JSON.stringify(payload));
  }, cachedPayload);

  await page.route("**/api/macro-snapshot*", route => route.abort("failed"));

  await page.goto("/");
  await expect(page.locator("#macroWarnings")).toContainText(/cached|缓存|--/i);
  await expect(page.locator("#macroSources")).toContainText(/Sources|数据源|CachedSource/i);
});
