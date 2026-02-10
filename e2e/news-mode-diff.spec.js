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
    sources: ["MockFeed", "MockWire"],
    items: [
      {
        id: "n1",
        title: "Rates pullback supports risk assets",
        summary: "USD softened while crypto beta recovered.",
        url: "https://example.com/news/1",
        source: "MockFeed",
        publishedAt: now - 20 * 60 * 1000,
        topics: ["macro", "rates"],
        symbols: ["BTC", "ETH"],
        sentimentHint: "positive",
        quality: "fresh"
      },
      {
        id: "n2",
        title: "Funding remains elevated",
        summary: "Leverage is still high in alt majors.",
        url: "https://example.com/news/2",
        source: "MockWire",
        publishedAt: now - 40 * 60 * 1000,
        topics: ["crypto"],
        symbols: ["SOL"],
        sentimentHint: "neutral",
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
    summary: "Mixed signals with mild risk-on bias.",
    headlineSummary: "Mixed signals with mild risk-on bias.",
    keyRisks: ["Leverage remains high.", "Liquidity can reverse quickly."],
    affectedAssets: [
      { symbol: "BTC", reason: "macro beta" },
      { symbol: "SOL", reason: "high beta sensitivity" }
    ],
    regimeImpact: "balanced",
    marketRegimeImpact: "balanced",
    confidence: 0.61,
    limitations: ["Headline-level interpretation only.", "No orderflow context."]
  };
}

test("news brief/pro modes render structurally different blocks", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cryptofolio_settings", JSON.stringify({
      newsEnabled: true,
      newsTopic: "all",
      newsSince: "24h",
      newsAnalysisMode: "brief",
      newsRefreshIntervalSec: 300
    }));
  });

  await page.route("**/api/news-feed**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildNewsPayload()) })
  );
  await page.route("**/api/news-insight", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(buildInsightPayload()) })
  );

  await page.goto("/#/news");
  await expect(page.locator("#newsInsightCard .news-insight-card.is-brief")).toBeVisible();
  await expect(page.locator("#newsInsightCard .news-pro-driver-matrix")).toHaveCount(0);

  await page.selectOption("#newsAnalysisModeSelect", "pro");
  await expect(page.locator("#newsInsightCard .news-insight-card.is-pro")).toBeVisible();
  await expect(page.locator("#newsInsightCard .news-pro-driver-matrix")).toBeVisible();
  await expect(page.locator("#newsInsightCard .news-pro-evidence")).toBeVisible();
  await expect(page.locator("#newsInsightCard .news-pro-timeline")).toBeVisible();
});
