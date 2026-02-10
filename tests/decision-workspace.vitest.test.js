import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/decision-workspace.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("decision workspace", () => {
  it("returns stable action output from mixed signals", () => {
    const result = window.AppDecisionWorkspace.computeDecision({
      macro: { regime: "RISK_ON", score: 72, confidence: 0.7 },
      news: { regimeImpact: "risk-on", confidence: 0.65 },
      stress: { deltaPct: 2.5 },
      calendar: { upcoming: [{ importance: "high" }] }
    });
    expect(["increase", "hold", "reduce"]).toContain(result.actionLevel);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("falls back to balanced defaults", () => {
    const result = window.AppDecisionWorkspace.computeDecision({});
    expect(result.regime).toBe("balanced");
    expect(result.actionLevel).toBe("hold");
  });
});

