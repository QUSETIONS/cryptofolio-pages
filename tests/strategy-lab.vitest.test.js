import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/strategy-lab.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppStrategyLab", () => {
  const priceData = {
    bitcoin: { usd: 50000 },
    ethereum: { usd: 2500 },
    tether: { usd: 1 }
  };

  const assets = [
    { id: 1, coinId: "bitcoin", amount: 1, costPrice: 40000 },
    { id: 2, coinId: "ethereum", amount: 10, costPrice: 2000 },
    { id: 3, coinId: "tether", amount: 10000, costPrice: 1 }
  ];

  function getCostBasis(asset) {
    return { amount: asset.amount };
  }

  it("normalizes targets and returns rebalance rows", () => {
    const result = window.AppStrategyLab.evaluateRebalance({
      assets,
      priceData,
      getCostBasis,
      targetWeights: { bitcoin: 40, ethereum: 40, tether: 20 },
      constraints: { maxSingleAssetPct: 60, minStablePct: 10, minTradeUsd: 0 },
      stableCoinIds: ["tether"],
      coinInfoMap: {
        bitcoin: { symbol: "BTC" },
        ethereum: { symbol: "ETH" },
        tether: { symbol: "USDT" }
      }
    });

    expect(result.totalValue).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.summary.afterTop1).toBeLessThanOrEqual(100);
  });

  it("applies stablecoin constraint warning", () => {
    const result = window.AppStrategyLab.evaluateRebalance({
      assets,
      priceData,
      getCostBasis,
      targetWeights: { bitcoin: 90, ethereum: 10 },
      constraints: { maxSingleAssetPct: 90, minStablePct: 20, minTradeUsd: 0 },
      stableCoinIds: ["tether"],
      coinInfoMap: {}
    });

    expect(result.summary.warnings).toContain("min_stable_applied");
  });
});
