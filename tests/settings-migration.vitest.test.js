import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const code = readFileSync(resolve(process.cwd(), "js/storage.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("settings migration", () => {
  it("migrates old settings to enable news by default", () => {
    const old = JSON.stringify({
      locale: "zh-CN",
      newsEnabled: false
    });
    const result = window.AppStorage.loadSettingsData(old);
    expect(result.newsEnabled).toBe(true);
    expect(result.newsPrefsVersion).toBe(2);
  });

  it("keeps explicit preference for new-version settings", () => {
    const payload = JSON.stringify({
      locale: "en-US",
      newsEnabled: false,
      newsPrefsVersion: 2
    });
    const result = window.AppStorage.loadSettingsData(payload);
    expect(result.newsEnabled).toBe(false);
    expect(result.newsPrefsVersion).toBe(2);
  });
});

