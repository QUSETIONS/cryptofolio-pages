import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/risk-attribution.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppRiskAttribution", () => {
  const assets = [
    { coinId: "bitcoin", amount: 1 },
    { coinId: "ethereum", amount: 10 }
  ];
  const priceData = {
    bitcoin: { usd: 50000, usd_24h_change: 2 },
    ethereum: { usd: 2500, usd_24h_change: -1 }
  };

  it("computes contribution and preserves totals for 24h", () => {
    const result = window.AppRiskAttribution.computeAttribution({
      assets,
      priceData,
      getCostBasis: asset => ({ amount: asset.amount }),
      coinInfoMap: { bitcoin: { symbol: "BTC" }, ethereum: { symbol: "ETH" } },
      window: "24h"
    });

    const rowContributionSum = result.rows.reduce((sum, row) => sum + row.contributionValue, 0);
    expect(result.totalValue).toBeGreaterThan(0);
    expect(Math.abs(result.totalContributionValue - rowContributionSum)).toBeLessThan(1e-6);
  });

  it("uses 7d window multiplier", () => {
    const daily = window.AppRiskAttribution.computeAttribution({
      assets,
      priceData,
      getCostBasis: asset => ({ amount: asset.amount }),
      window: "24h"
    });
    const weekly = window.AppRiskAttribution.computeAttribution({
      assets,
      priceData,
      getCostBasis: asset => ({ amount: asset.amount }),
      window: "7d"
    });

    expect(Math.abs(weekly.totalContributionPct)).toBeGreaterThanOrEqual(Math.abs(daily.totalContributionPct));
  });
});
