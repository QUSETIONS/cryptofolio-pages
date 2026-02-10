import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const configCode = readFileSync(resolve(process.cwd(), "js/config.js"), "utf8");
  const utilsCode = readFileSync(resolve(process.cwd(), "js/utils.js"), "utf8");
  const storageCode = readFileSync(resolve(process.cwd(), "js/storage.js"), "utf8");
  const demoSeedCode = readFileSync(resolve(process.cwd(), "js/demo-seed.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(configCode);
  // eslint-disable-next-line no-eval
  eval(utilsCode);
  // eslint-disable-next-line no-eval
  eval(storageCode);
  // eslint-disable-next-line no-eval
  eval(demoSeedCode);
});

describe("AppStorage import normalizers", () => {
  it("drops unknown coinId rows and keeps valid assets", () => {
    const coinInfoMap = { bitcoin: { symbol: "BTC" } };
    const result = window.AppStorage.normalizeImportedAssets(
      [
        { id: 1, coinId: "bitcoin", amount: 1, costPrice: 100 },
        { id: 2, coinId: "unknown-coin", amount: 1, costPrice: 100 }
      ],
      coinInfoMap
    );
    expect(result.items).toHaveLength(1);
    expect(result.dropped).toBe(1);
  });

  it("sanitizes imported history message text", () => {
    const result = window.AppStorage.normalizeImportedHistory(
      [
        {
          id: 1,
          timestamp: Date.now(),
          message: `<img src=x onerror="alert('xss')"><script>alert(1)</script>ok`
        }
      ],
      30,
      window.AppUtils.sanitizeText
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].message).not.toContain("<script>");
    expect(result.items[0].message).not.toContain("onerror");
  });

  it("accepts demo seed payload with low drop count", () => {
    const payload = window.AppDemoSeed.loadRealisticSnapshotDemo();
    const assets = window.AppStorage.normalizeImportedAssets(payload.data.assets, window.AppConfig.COIN_INFO);
    const assetIds = new Set(assets.items.map(item => item.id));
    const tx = window.AppStorage.normalizeImportedTransactions(
      payload.data.transactions,
      assetIds,
      window.AppConfig.COIN_INFO,
      window.AppUtils.sanitizeText
    );
    const alerts = window.AppStorage.normalizeImportedAlerts(
      payload.data.alertRules,
      window.AppConfig.COIN_INFO,
      window.AppUtils.sanitizeText
    );
    const history = window.AppStorage.normalizeImportedHistory(
      payload.data.alertHistory,
      30,
      window.AppUtils.sanitizeText
    );
    expect(assets.dropped).toBe(0);
    expect(tx.dropped).toBeLessThanOrEqual(2);
    expect(alerts.dropped).toBe(0);
    expect(history.dropped).toBe(0);
  });
});
