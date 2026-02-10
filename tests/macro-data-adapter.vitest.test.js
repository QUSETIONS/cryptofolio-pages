import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/macro-data-adapter.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppMacroDataAdapter", () => {
  it("parses valid payload and maps series", () => {
    const payload = {
      window: "30D",
      quality: "fresh",
      updatedAt: Date.now(),
      sources: ["A", "B"],
      factors: {
        totalMarketCapUsd: 1,
        totalVolumeUsd: 2,
        marketCapChange24h: 3,
        btcDominance: 54
      },
      series: [
        { id: "crypto_btc", points: [{ ts: Date.now() - 1000, value: 100 }, { ts: Date.now(), value: 105 }] }
      ]
    };
    const result = window.AppMacroDataAdapter.parse(payload);
    expect(result.valid).toBe(true);
    expect(result.window).toBe("30D");
    expect(result.seriesMap.crypto_btc.points.length).toBe(2);
    expect(result.warnings.some(item => item.includes("missing_"))).toBe(true);
  });

  it("degrades invalid payload safely", () => {
    const result = window.AppMacroDataAdapter.parse(null);
    expect(result.valid).toBe(false);
    expect(result.quality).toBe("stale");
    expect(result.warnings).toContain("invalid_payload");
  });
});
