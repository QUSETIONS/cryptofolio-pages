import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeAll(() => {
  globalThis.window = {};
  const enCode = readFileSync(resolve(process.cwd(), "js/i18n/messages.en.js"), "utf8");
  const zhCode = readFileSync(resolve(process.cwd(), "js/i18n/messages.zh.js"), "utf8");
  // eslint-disable-next-line no-eval
  eval(enCode);
  // eslint-disable-next-line no-eval
  eval(zhCode);
});

describe("i18n health", () => {
  it("has critical zh-cn keys with readable values", () => {
    const zh = window.AppI18nMessagesZh;
    expect(zh["nav.dashboard"]).toBe("总览");
    expect(zh["button.languageZh"]).toBe("中文");
    expect(zh["settings.locale.zh"]).toBe("简体中文");
    expect(zh["news.title"]).toBe("新闻与解读");
    expect(zh["strategy.title"]).toBe("策略实验室");
    expect(zh["stress.title"]).toBe("压力测试");
    expect(zh["attribution.title"]).toBe("风险归因");
  });

  it("does not contain replacement chars or mojibake signatures", () => {
    const zh = window.AppI18nMessagesZh;
    const signatures = [/鎴|璁|浣|锟|��|涓|绠€|鏂伴椈/];
    Object.values(zh).forEach((value) => {
      const text = String(value || "");
      expect(text).not.toContain("\ufffd");
      signatures.forEach((pattern) => {
        expect(pattern.test(text)).toBe(false);
      });
    });
  });

  it("does not leak template placeholders for summary labels", () => {
    const en = window.AppI18nMessagesEn;
    const zh = window.AppI18nMessagesZh;
    const keys = [
      "strategy.summary.beforeTop1",
      "strategy.summary.beforeTop3",
      "strategy.summary.afterTop1",
      "strategy.summary.afterTop3",
      "stress.summary.current",
      "stress.summary.stressed"
    ];
    keys.forEach((key) => {
      expect(String(en[key] || "")).not.toContain("{{value}}");
      expect(String(zh[key] || "")).not.toContain("{{value}}");
    });
  });
});
