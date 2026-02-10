import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/domain-portfolio.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppPortfolioDomain risk and stats", () => {
  it("calculates portfolio stats", () => {
    const assets = [{ id: 1, coinId: "bitcoin" }];
    const priceData = { bitcoin: { usd: 100, usd_24h_change: 10 } };
    const getCostBasis = () => ({ amount: 1, totalCost: 80, avgCost: 80 });
    const stats = window.AppPortfolioDomain.calculatePortfolioStats(assets, priceData, getCostBasis);
    expect(stats.totalValue).toBe(100);
    expect(stats.totalCost).toBe(80);
    expect(stats.totalProfit).toBe(20);
  });

  it("calculates risk metrics including var95 and drawdown band", () => {
    const assets = [{ id: 1, coinId: "bitcoin" }];
    const priceData = { bitcoin: { usd: 100, usd_24h_change: 0 } };
    const snapshots = [
      { timestamp: 1, value: 120 },
      { timestamp: 2, value: 90 },
      { timestamp: 3, value: 100 }
    ];
    const stats = { totalValue: 100 };
    const getCostBasis = () => ({ amount: 1, totalCost: 80, avgCost: 80 });
    const risk = window.AppPortfolioDomain.calculateRiskMetrics(
      assets,
      priceData,
      snapshots,
      stats,
      getCostBasis
    );
    expect(risk.maxDrawdown).toBeGreaterThan(0);
    expect(risk.var95).toBeGreaterThanOrEqual(0);
    expect(["Low", "Medium", "High"]).toContain(risk.drawdownBand);
  });
});
