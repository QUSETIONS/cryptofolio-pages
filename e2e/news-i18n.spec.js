const { test, expect } = require("@playwright/test");

function mockFeed(now) {
  return {
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
        title: "Global liquidity and rates headlines",
        summary: "Summary for i18n switching test.",
        url: "https://example.com/news/i18n",
        source: "MockFeed",
        publishedAt: now - 10 * 60 * 1000,
        topics: ["macro"],
        symbols: ["BTC"],
        sentimentHint: "neutral",
        quality: "fresh"
      }
    ]
  };
}

function mockInsight() {
  return {
    ok: true,
    mode: "fallback",
    asOf: Date.now(),
    headlineSummary: "Neutral setup with mixed risk signals.",
    keyRisks: ["Volatility remains elevated."],
    affectedAssets: [{ symbol: "BTC", reason: "macro linkage" }],
    regimeImpact: "balanced",
    marketRegimeImpact: "balanced",
    confidence: 0.58,
    limitations: ["Headline interpretation only."]
  };
}

test("news section switches locale labels between en-US and zh-CN", async ({ page }) => {
  const now = Date.now();
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      locale: "en-US",
      newsEnabled: true,
      newsTopic: "all",
      newsSince: "24h",
      newsAnalysisMode: "brief",
      newsRefreshIntervalSec: 300
    }));
  });
  await page.route("**/api/news-feed*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockFeed(now)) })
  );
  await page.route("**/api/news-insight*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockInsight()) })
  );

  await page.goto("/#/news");
  await expect(page.locator("h3[data-i18n='news.title']")).toContainText(/News|新闻/);

  await page.goto("/#/settings");
  await page.selectOption("#localeSelect", "zh-CN");
  await expect(page.locator("#localeSelect")).toHaveValue("zh-CN");
  await page.goto("/#/news");

  await expect(page.locator("h3[data-i18n='news.title']")).toContainText(/News|新闻/);
  await expect(page.locator("#newsNextRefresh")).toContainText(/Next refresh|下次刷新/);
});
