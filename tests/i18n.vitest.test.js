import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  globalThis.document = { documentElement: { lang: "en" }, querySelectorAll: () => [] };
  const enCode = readFileSync(resolve(process.cwd(), "js/i18n/messages.en.js"), "utf8");
  const zhCode = readFileSync(resolve(process.cwd(), "js/i18n/messages.zh.js"), "utf8");
  const code = readFileSync(resolve(process.cwd(), "js/i18n.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(enCode);
  // eslint-disable-next-line no-eval
  eval(zhCode);
  // eslint-disable-next-line no-eval
  eval(code);
});

describe("AppI18n", () => {
  it("switches locale and returns translated text", () => {
    window.AppI18n.setLocale("en-US");
    const enLabel = window.AppI18n.t("nav.dashboard");

    window.AppI18n.setLocale("zh-CN");
    expect(window.AppI18n.getLocale()).toBe("zh-CN");

    const zhLabel = window.AppI18n.t("nav.dashboard");
    expect(typeof zhLabel).toBe("string");
    expect(zhLabel.length).toBeGreaterThan(0);
    expect(zhLabel).not.toBe(enLabel);
  });

  it("supports interpolation with fallback", () => {
    window.AppI18n.setLocale("en-US");
    const text = window.AppI18n.t("toast.importSummary", { kept: 8, dropped: 2 });
    expect(text).toContain("kept 8");
    expect(text).toContain("dropped 2");
    expect(window.AppI18n.t("non.existing.key")).toBe("non.existing.key");
  });
});
