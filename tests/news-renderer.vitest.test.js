import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/news-renderer.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

const t = key => key;
const escapeHtml = value => String(value);
const formatPercent = value => `${Number(value).toFixed(2)}%`;
const formatTime = value => String(value);

describe("AppNewsRenderer.renderInsight", () => {
  it("renders brief mode without pro blocks", () => {
    const html = window.AppNewsRenderer.renderInsight({
      insight: {
        headlineSummary: "Brief summary",
        keyRisks: ["r1", "r2", "r3"],
        affectedAssets: [{ symbol: "BTC", reason: "beta" }],
        limitations: ["l1"],
        confidence: 0.55,
        regimeImpact: "balanced"
      },
      t,
      formatPercent,
      formatTime,
      mode: "brief",
      escapeHtml,
      locale: "en-US",
      insightMeta: null,
      timelineItems: []
    });

    expect(html).toContain("is-brief");
    expect(html).not.toContain("news-pro-driver-matrix");
    expect(html).toContain("news.brief.quickTake");
  });

  it("renders pro mode with matrix, evidence and timeline", () => {
    const html = window.AppNewsRenderer.renderInsight({
      insight: {
        headlineSummary: "Pro summary",
        keyRisks: ["r1", "r2"],
        affectedAssets: [{ symbol: "BTC", reason: "beta" }],
        limitations: ["l1"],
        confidence: 0.71,
        regimeImpact: "risk-on"
      },
      t,
      formatPercent,
      formatTime,
      mode: "pro",
      escapeHtml,
      locale: "en-US",
      insightMeta: { asOf: 1, quality: "fresh", sources: ["A"], itemCount: 2 },
      timelineItems: [{ title: "headline", publishedAt: 1, source: "A" }]
    });

    expect(html).toContain("is-pro");
    expect(html).toContain("news-pro-driver-matrix");
    expect(html).toContain("news-pro-evidence");
    expect(html).toContain("news-pro-timeline");
  });
});
