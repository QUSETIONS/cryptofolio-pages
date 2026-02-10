const { test, expect } = require("@playwright/test");

function macroPayload() {
  const now = Date.now();
  const mk = base => [
    { ts: now - 3 * 24 * 60 * 60 * 1000, value: base },
    { ts: now - 2 * 24 * 60 * 60 * 1000, value: base * 1.01 },
    { ts: now - 1 * 24 * 60 * 60 * 1000, value: base * 1.03 },
    { ts: now, value: base * 1.04 }
  ];
  return {
    window: "30D",
    quality: "fresh",
    updatedAt: now,
    sources: ["Mock"],
    factors: {
      totalMarketCapUsd: 1000000,
      totalVolumeUsd: 10000,
      marketCapChange24h: 1.2,
      btcDominance: 52
    },
    series: [
      { id: "crypto_btc", label: "Bitcoin", category: "crypto", source: "Mock", points: mk(100) },
      { id: "equity_sp500", label: "S&P 500", category: "equity", source: "Mock", points: mk(100) },
      { id: "dollar_dxy", label: "DXY", category: "fx", source: "Mock", points: mk(100) },
      { id: "rates_ust10y", label: "UST10Y", category: "rates", source: "Mock", points: mk(100) },
      { id: "gold_xau", label: "Gold", category: "commodity", source: "Mock", points: mk(100) }
    ]
  };
}

test("calendar events render and decision workspace updates", async ({ page }) => {
  const now = Date.now();
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      newsEnabled: true,
      newsPrefsVersion: 2,
      calendarEnabled: true
    }));
  });

  await page.route("**/api/macro-snapshot*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(macroPayload()) })
  );
  await page.route("**/api/news-feed*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true,
      updatedAt: now,
      quality: "fresh",
      topic: "all",
      since: "24h",
      locale: "en-US",
      sources: ["MockFeed"],
      items: [{
        id: "n1",
        title: "Fed policy outlook",
        summary: "Macro headline",
        url: "https://example.com/n1",
        source: "MockFeed",
        publishedAt: now - 10000,
        topics: ["macro"],
        symbols: ["BTC"],
        sentimentHint: "neutral",
        quality: "fresh"
      }]
    }) })
  );
  await page.route("**/api/news-insight*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true,
      mode: "fallback",
      asOf: now,
      summary: "Balanced setup",
      headlineSummary: "Balanced setup",
      keyRisks: ["Risk A"],
      affectedAssets: [{ symbol: "BTC", reason: "mentioned" }],
      regimeImpact: "balanced",
      marketRegimeImpact: "balanced",
      confidence: 0.6,
      limitations: ["Limit A"]
    }) })
  );
  await page.route("**/api/econ-calendar*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true,
      updatedAt: now,
      quality: "fresh",
      locale: "en-US",
      window: "7d",
      importance: "all",
      events: [{
        id: "e1",
        title: "FOMC Rate Decision",
        country: "US",
        timestamp: now + 3600000,
        importance: "high",
        consensus: "5.25%",
        previous: "5.25%",
        category: "rates",
        relatedAssets: ["BTC", "DXY"]
      }]
    }) })
  );

  await page.goto("/");
  await expect(page.locator("#calendarEventsList")).toHaveCount(1);
  await expect(page.locator("#decisionWorkspaceCard")).toHaveCount(1);
});
