const { test, expect } = require("@playwright/test");

test("news falls back to cached snapshot when API fails", async ({ page }) => {
  const now = Date.now();
  await page.addInitScript(({ ts }) => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      newsEnabled: true,
      newsTopic: "all",
      newsSince: "24h",
      newsAnalysisMode: "brief",
      newsRefreshIntervalSec: 300
    }));
    localStorage.setItem("cryptofolio_news_snapshot_v1", JSON.stringify({
      ok: true,
      updatedAt: ts - 60_000,
      quality: "fresh",
      topic: "all",
      since: "24h",
      locale: "en-US",
      sources: ["CachedFeed"],
      items: [
        {
          id: "cached-1",
          title: "Cached headline",
          summary: "Cached summary",
          url: "https://example.com/cached",
          source: "CachedFeed",
          publishedAt: ts - 120_000,
          topics: ["macro"],
          symbols: ["BTC"],
          sentimentHint: "neutral",
          quality: "fresh"
        }
      ],
      warnings: []
    }));
    localStorage.setItem("cryptofolio_news_insight_cache_v1", JSON.stringify({
      mode: "fallback",
      headlineSummary: "Cached insight summary",
      keyRisks: ["Cached risk"],
      affectedAssets: [{ symbol: "BTC", reason: "cached" }],
      regimeImpact: "balanced",
      confidence: 0.51,
      limitations: ["Cached limitation"]
    }));
  }, { ts: now });

  await page.route("**/api/news-feed*", route => route.fulfill({ status: 500, body: "error" }));
  await page.route("**/api/news-insight*", route => route.fulfill({ status: 500, body: "error" }));

  await page.goto("/#/news");
  await expect(page.locator("#newsFeedList")).toHaveCount(1);
  await expect(page.locator("#newsInsightCard")).toHaveCount(1);
  await expect(page.locator("#newsQuality")).toContainText(/stale|过期|延迟|partial|--/i);
});
