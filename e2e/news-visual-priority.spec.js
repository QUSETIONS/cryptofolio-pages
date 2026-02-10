const { test, expect } = require("@playwright/test");

test("news list applies featured visual priority to first card", async ({ page }) => {
  const now = Date.now();
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      newsEnabled: true,
      newsTopic: "all",
      newsSince: "24h",
      newsAnalysisMode: "brief",
      newsRefreshIntervalSec: 300
    }));
  });

  await page.route("**/api/news-feed**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      updatedAt: now,
      quality: "fresh",
      topic: "all",
      since: "24h",
      locale: "en-US",
      sources: ["MockFeed"],
      items: [
        {
          id: "n1",
          title: "Lead story",
          summary: "Top priority headline",
          url: "https://example.com/lead",
          source: "MockFeed",
          publishedAt: now - 10_000,
          topics: ["macro"],
          symbols: ["BTC"],
          sentimentHint: "neutral",
          quality: "fresh"
        },
        {
          id: "n2",
          title: "Secondary story",
          summary: "Secondary headline",
          url: "https://example.com/secondary",
          source: "MockFeed",
          publishedAt: now - 30_000,
          topics: ["crypto"],
          symbols: ["ETH"],
          sentimentHint: "neutral",
          quality: "fresh"
        }
      ]
    })
  }));

  await page.route("**/api/news-insight", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      mode: "fallback",
      asOf: now,
      headlineSummary: "Summary",
      keyRisks: ["Risk 1"],
      affectedAssets: [{ symbol: "BTC", reason: "test" }],
      regimeImpact: "balanced",
      confidence: 0.5,
      limitations: ["None"]
    })
  }));

  await page.goto("/#/news");
  await expect(page.locator("#newsFeedList .news-item").first()).toHaveClass(/featured/);
  await expect(page.locator("#newsFeedList .news-item").nth(1)).toHaveClass(/standard/);
});
