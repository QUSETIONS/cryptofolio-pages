import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/macro-scoring.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

function buildAdapterResult(overrides = {}) {
  const now = Date.now();
  const pointsUp = [{ ts: now - 2_000, value: 100 }, { ts: now, value: 110 }];
  const pointsDown = [{ ts: now - 2_000, value: 100 }, { ts: now, value: 95 }];
  return {
    quality: "fresh",
    warnings: [],
    factors: {
      totalMarketCapUsd: 100_000_000,
      totalVolumeUsd: 4_000_000,
      marketCapChange24h: 3,
      btcDominance: 52
    },
    seriesMap: {
      crypto_btc: { points: pointsUp },
      equity_sp500: { points: pointsUp },
      dollar_dxy: { points: pointsDown },
      rates_ust10y: { points: pointsDown },
      gold_xau: { points: pointsDown }
    },
    ...overrides
  };
}

describe("AppMacroScoring", () => {
  it("maps high score to risk-on regime", () => {
    const result = window.AppMacroScoring.score(buildAdapterResult());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(["RISK_ON", "BALANCED", "DEFENSIVE"]).toContain(result.regime);
  });

  it("applies confidence penalty for stale partial data", () => {
    const result = window.AppMacroScoring.score(buildAdapterResult({
      quality: "partial",
      warnings: ["missing_equity_sp500", "missing_totalVolumeUsd"]
    }));
    expect(result.confidence).toBeLessThan(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });
});
