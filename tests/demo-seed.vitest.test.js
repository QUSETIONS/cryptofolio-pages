import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/demo-seed.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppDemoSeed", () => {
  it("builds realistic payload with expected sections", () => {
    const payload = window.AppDemoSeed.loadRealisticSnapshotDemo();
    expect(payload.data.assets.length).toBe(10);
    expect(payload.data.transactions.length).toBeGreaterThanOrEqual(60);
    expect(payload.data.alertRules.length).toBeGreaterThanOrEqual(4);
    expect(payload.data.snapshots.length).toBeGreaterThanOrEqual(30);
    expect(payload.data.settings.locale).toBe("en-US");
  });

  it("contains only BUY/SELL transaction types", () => {
    const payload = window.AppDemoSeed.loadRealisticSnapshotDemo();
    const invalid = payload.data.transactions.filter(tx => tx.type !== "BUY" && tx.type !== "SELL");
    expect(invalid).toHaveLength(0);
  });
});
