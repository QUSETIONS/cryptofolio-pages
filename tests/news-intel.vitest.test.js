import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function makeClassList() {
  const set = new Set();
  return {
    add: token => set.add(token),
    remove: token => set.delete(token),
    toggle: (token, force) => {
      if (force === true) set.add(token);
      else if (force === false) set.delete(token);
      else if (set.has(token)) set.delete(token);
      else set.add(token);
    },
    contains: token => set.has(token)
  };
}

function makeNode() {
  return {
    innerHTML: "",
    textContent: "",
    classList: makeClassList(),
    addEventListener: () => {}
  };
}

beforeAll(() => {
  globalThis.window = {};
  globalThis.localStorage = {
    store: new Map(),
    getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
    setItem(key, value) { this.store.set(key, value); },
    removeItem(key) { this.store.delete(key); }
  };
  const code = readFileSync(resolve(process.cwd(), "js/news-intel.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppNewsIntel.createNewsIntel", () => {
  it("returns analysis with asOf/sources/quality/topDrivers after refresh", async () => {
    const elements = {
      newsFeedList: makeNode(),
      newsInsightCard: makeNode(),
      newsTopicSelect: makeNode(),
      newsSinceSelect: makeNode(),
      newsAnalysisModeSelect: makeNode(),
      newsUpdated: makeNode(),
      newsQuality: makeNode(),
      newsSources: makeNode(),
      newsNextRefresh: makeNode(),
      newsLoadMoreBtn: makeNode(),
      newsFilterState: makeNode(),
      newsModeHint: makeNode()
    };

    const intel = window.AppNewsIntel.createNewsIntel({
      elements,
      t: key => key,
      localeGetter: () => "en-US",
      showToast: () => {},
      fetchNewsFeed: async () => ({ ok: true }),
      fetchNewsInsight: async () => ({
        asOf: 1700000000000,
        keyRisks: ["r1", "r2", "r3"],
        confidence: 0.66,
        regimeImpact: "balanced"
      }),
      parseNewsPayload: () => ({
        ok: true,
        updatedAt: 1700000000001,
        quality: "fresh",
        sources: ["MockFeed"],
        items: [{ id: "n1", title: "t", source: "s", publishedAt: Date.now() }]
      }),
      renderNewsFeed: () => "<article></article>",
      renderNewsInsight: () => "<section></section>",
      getSettings: () => ({ newsEnabled: true, newsAnalysisMode: "pro", newsRefreshIntervalSec: 300, newsTopic: "all", newsSince: "24h" }),
      getPortfolioContext: () => ({}),
      escapeHtml: value => String(value),
      formatPercent: value => `${Number(value).toFixed(2)}%`,
      formatTime: value => String(value),
      onJumpToSymbol: () => {}
    });

    await intel.refresh({ force: true });
    const analysis = intel.getAnalysis();
    expect(analysis).toBeTruthy();
    expect(analysis.asOf).toBe(1700000000000);
    expect(analysis.quality).toBe("fresh");
    expect(analysis.sources).toEqual(["MockFeed"]);
    expect(analysis.topDrivers).toEqual(["r1", "r2", "r3"]);
  });
});
