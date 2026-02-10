const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadMessages(fileName, globalKey) {
  const fullPath = path.join(process.cwd(), "js", "i18n", fileName);
  const code = fs.readFileSync(fullPath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window[globalKey] || {};
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const en = loadMessages("messages.en.js", "AppI18nMessagesEn");
  const zh = loadMessages("messages.zh.js", "AppI18nMessagesZh");

  assert(Object.keys(en).length > 200, "en messages too small");
  assert(Object.keys(zh).length > 200, "zh messages too small");

  const requiredZhExact = {
    "nav.dashboard": "总览",
    "button.languageZh": "中文",
    "settings.locale.zh": "简体中文",
    "news.title": "新闻与解读",
    "settings.news.enabled": "启用新闻模块",
    "strategy.title": "策略实验室",
    "stress.title": "压力测试",
    "attribution.title": "风险归因",
    "macro.scoreLabel": "风险评分：{{score}} / 100"
  };

  Object.entries(requiredZhExact).forEach(([key, value]) => {
    assert(zh[key] === value, `zh key mismatch: ${key}`);
  });

  const mojibakePatterns = [/鎴|璁|浣|锟|��|涓|绠€|鏂伴椈/];
  Object.entries(zh).forEach(([key, value]) => {
    const text = String(value || "");
    assert(!text.includes("\ufffd"), `replacement char found in zh key: ${key}`);
    mojibakePatterns.forEach((pattern) => {
      assert(!pattern.test(text), `possible mojibake found in zh key: ${key}`);
    });
  });

  const labelKeys = [
    "strategy.summary.beforeTop1",
    "strategy.summary.beforeTop3",
    "strategy.summary.afterTop1",
    "strategy.summary.afterTop3",
    "stress.summary.current",
    "stress.summary.stressed"
  ];

  labelKeys.forEach((key) => {
    const enValue = String(en[key] || "");
    const zhValue = String(zh[key] || "");
    assert(!enValue.includes("{{value}}"), `placeholder leak in en key: ${key}`);
    assert(!zhValue.includes("{{value}}"), `placeholder leak in zh key: ${key}`);
  });

  [
    "strategy.status.success",
    "stress.status.success",
    "attribution.status.success",
    "news.providerRequired",
    "news.providerRequiredHint"
  ].forEach((key) => {
    assert(Boolean(en[key]), `missing en key: ${key}`);
    assert(Boolean(zh[key]), `missing zh key: ${key}`);
  });

  console.log("check-i18n-health passed.");
}

main();
