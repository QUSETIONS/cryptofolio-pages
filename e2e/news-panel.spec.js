const { test, expect } = require("@playwright/test");

function buildNewsPayload() {
  const now = Date.now();
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
        title: "Fed pauses as liquidity improves",
        summary: "Markets react to softer macro pressure.",
        url: "https://example.com/news/1",
        source: "MockFeed",
        publishedAt: now - 5 * 60 * 1000,
        topics: ["macro", "rates"],
        symbols: ["BTC", "ETH"],
        sentimentHint: "positive",
        quality: "fresh"
      }
    ]
  };
}

function buildInsightPayload() {
  return {
    ok: true,
    mode: "fallback",
    asOf: Date.now(),
    summary: "Risk appetite is improving with lower rates pressure.",
    headlineSummary: "Risk appetite is improving with lower rates pressure.",
    keyRisks: ["Liquidity can reverse quickly."],
    affectedAssets: [{ symbol: "BTC", reason: "mentioned 2 times" }],
    regimeImpact: "balanced",
    marketRegimeImpact: "balanced",
    confidence: 0.66,
    limitations: ["Headline-level interpretation."]
  };
}

test("news panel renders feed and insight", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      newsEnabled: true,
      newsTopic: "all",
      newsSince: "24h",
      newsAnalysisMode: "brief",
      newsRefreshIntervalSec: 300
    }));
  });

  await page.route("**/api/news-feed*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildNewsPayload()) })
  );
  await page.route("**/api/news-insight*", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildInsightPayload()) })
  );

  await page.goto("/#/news");
  await expect(page.locator(".news-section")).toBeVisible();
  await expect(page.locator("#newsTopicSelect")).toBeVisible();
  await expect(page.locator("#newsSinceSelect")).toBeVisible();
  await expect(page.locator("#newsAnalysisModeSelect")).toBeVisible();

  await page.locator("#newsRefreshBtn").click({ force: true });
  await expect(page.locator("#newsFeedList")).toHaveCount(1);
  await expect(page.locator("#newsInsightCard")).toHaveCount(1);
  await expect(page.locator("#newsSources")).toContainText(/Sources:|来源[:：]/);
});



