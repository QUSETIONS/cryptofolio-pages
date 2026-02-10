import { describe, it, expect } from "vitest";

const newsInsight = require("../api/news-insight.js");

describe("news insight schema and fallback", () => {
  it("validates strict insight shape", () => {
    const valid = {
      headlineSummary: "summary",
      keyRisks: ["risk1"],
      affectedAssets: [{ symbol: "BTC", reason: "mentioned 2 times" }],
      marketRegimeImpact: "balanced",
      confidence: 0.6,
      limitations: ["limit"]
    };
    expect(newsInsight._internals.validateInsightShape(valid)).toBe(true);
    expect(newsInsight._internals.validateInsightShape({})).toBe(false);
  });

  it("fallback insight returns constrained fields", () => {
    const items = [
      { title: "Bitcoin rallies", source: "A", symbols: ["BTC"], sentimentHint: "positive" },
      { title: "Fed remains hawkish", source: "B", symbols: ["ETH"], sentimentHint: "negative" }
    ];
    const result = newsInsight._internals.fallbackInsight(items, "en-US");
    expect(["risk-on", "balanced", "defensive"]).toContain(result.marketRegimeImpact);
    expect(Array.isArray(result.keyRisks)).toBe(true);
    expect(result.keyRisks.length).toBeGreaterThan(0);
    expect(Array.isArray(result.limitations)).toBe(true);
  });
});

