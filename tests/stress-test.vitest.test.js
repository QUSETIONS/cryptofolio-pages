import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/stress-test.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppStressTest", () => {
  const portfolio = {
    assets: [
      { coinId: "bitcoin", amount: 1 },
      { coinId: "ethereum", amount: 10 },
      { coinId: "tether", amount: 1000 }
    ],
    priceData: {
      bitcoin: { usd: 50000 },
      ethereum: { usd: 2500 },
      tether: { usd: 1 }
    },
    getCostBasis: asset => ({ amount: asset.amount }),
    coinInfoMap: {
      bitcoin: { symbol: "BTC" },
      ethereum: { symbol: "ETH" },
      tether: { symbol: "USDT" }
    },
    stableCoinIds: ["tether"]
  };

  it("computes stress scenario totals", () => {
    const result = window.AppStressTest.runScenario(portfolio, {
      id: "risk_off",
      label: "Risk Off",
      shocks: { byCoin: { bitcoin: -12, ethereum: -15 }, groups: { market: -8, stable: 0 } }
    });

    expect(result.totalCurrent).toBeGreaterThan(0);
    expect(result.totalStressed).toBeLessThan(result.totalCurrent);
    expect(result.maxDrawdownApprox).toBeGreaterThanOrEqual(0);
  });

  it("supports custom per-coin positive shocks", () => {
    const result = window.AppStressTest.runScenario(portfolio, {
      id: "rally",
      label: "Rally",
      shocks: { byCoin: { bitcoin: 10, ethereum: 15, tether: 0 } }
    });

    expect(result.totalDelta).toBeGreaterThan(0);
    expect(result.topGain.length).toBeGreaterThan(0);
  });
});
