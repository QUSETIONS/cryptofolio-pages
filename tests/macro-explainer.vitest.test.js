import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/macro-explainer.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

function t(key, params) {
  if (!params) return key;
  return `${key}:${JSON.stringify(params)}`;
}

describe("AppMacroExplainer", () => {
  it("returns structured explanation fields", () => {
    const scoreResult = {
      regime: "BALANCED",
      score: 55.2,
      confidence: 0.78,
      topDrivers: [
        { key: "trend", value: 12 },
        { key: "liquidity", value: -7 }
      ],
      warnings: ["partial_data"]
    };
    const result = window.AppMacroExplainer.explain(scoreResult, t, "brief", {
      adapterResult: { quality: "fresh", updatedAt: 123 }
    });
    expect(result.regimeLabel).toContain("macro.regimeBalanced");
    expect(result.scoreLabel).toContain("macro.scoreLabel");
    expect(result.topDrivers.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBe(1);
    expect(result.confidenceLabel).toContain("macro.confidenceLabel");
    expect(result.mode).toBe("brief");
  });

  it("creates different outputs for brief and pro", () => {
    const scoreResult = {
      regime: "BALANCED",
      score: 55.2,
      confidence: 0.78,
      factors: {
        trend: 60,
        breadth: 52,
        volatility: 45,
        concentration: 49,
        liquidity: 66
      },
      topDrivers: [
        { key: "trend", value: 12 },
        { key: "liquidity", value: -7 }
      ],
      warnings: []
    };
    const brief = window.AppMacroExplainer.explain(scoreResult, t, "brief", {
      adapterResult: { quality: "fresh", updatedAt: 123 }
    });
    const pro = window.AppMacroExplainer.explain(scoreResult, t, "pro", {
      adapterResult: { quality: "fresh", updatedAt: 123 }
    });
    expect(brief.mode).toBe("brief");
    expect(pro.mode).toBe("pro");
    expect(brief.summaryLines[0]).not.toEqual(pro.summaryLines[0]);
    expect(pro.proDetails.methodologyLine).toContain("macro.pro.methodology");
  });
});
