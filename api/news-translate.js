const { sanitizeText } = require("./_news-core");

function normalizeLocale(locale) {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

function looksMostlyAscii(text) {
  const value = String(text || "");
  if (!value) return false;
  const stripped = value.replace(/\s+/g, "");
  if (!stripped) return false;
  const asciiCount = (stripped.match(/[A-Za-z]/g) || []).length;
  return asciiCount / stripped.length >= 0.35;
}

function localizeHeadlineZh(text) {
  if (!text) return "";
  let out = String(text);
  const replacements = [
    [/stocks?/gi, "股市"],
    [/shares?/gi, "股票"],
    [/dollar/gi, "美元"],
    [/bond yields?/gi, "债券收益率"],
    [/earnings/gi, "财报"],
    [/revenue/gi, "营收"],
    [/estimates?/gi, "预期"],
    [/risk[- ]off/gi, "风险偏好下降"],
    [/risk[- ]on/gi, "风险偏好回升"],
    [/inflation/gi, "通胀"],
    [/rate cut/gi, "降息"],
    [/rate hike/gi, "加息"],
    [/federal reserve|fed/gi, "美联储"],
    [/bitcoin/gi, "比特币"],
    [/ethereum/gi, "以太坊"],
    [/crypto/gi, "加密市场"],
    [/gold/gi, "黄金"],
    [/oil/gi, "原油"],
    [/nasdaq/gi, "纳指"],
    [/s&p ?500/gi, "标普500"],
    [/nikkei/gi, "日经指数"]
  ];
  replacements.forEach(([pattern, next]) => {
    out = out.replace(pattern, next);
  });
  return out;
}

function buildSimpleSummaryZh(titleZh, summaryZh, source) {
  const compactSummary = sanitizeText(summaryZh || "", 180)
    .replace(/\s+/g, " ")
    .replace(/[;:]+/g, "，")
    .replace(/[。！？]+$/g, "");
  if (compactSummary) {
    return `发生了什么：${compactSummary}。来源：${source}。`;
  }

  const compactTitle = sanitizeText(titleZh || "", 120)
    .replace(/\s+/g, " ")
    .replace(/[;:]+/g, "，")
    .replace(/[。！？]+$/g, "");
  if (compactTitle) {
    return `发生了什么：${compactTitle}。可能影响：相关资产短线波动加大。`;
  }

  return "发生了什么：暂无详细信息，建议打开原文确认关键细节。";
}

function translateWithRules(items) {
  return items.map((item) => {
    const originalTitle = sanitizeText(item?.title, 220);
    const originalSummary = sanitizeText(item?.summary, 360);
    const source = sanitizeText(item?.source, 80) || "新闻源";
    const titleZh = looksMostlyAscii(originalTitle) ? localizeHeadlineZh(originalTitle) : originalTitle;
    const baseSummaryZh = originalSummary
      ? (looksMostlyAscii(originalSummary) ? localizeHeadlineZh(originalSummary) : originalSummary)
      : "";
    const summaryZh = buildSimpleSummaryZh(titleZh, baseSummaryZh, source);

    return {
      id: String(item?.id || ""),
      title: originalTitle,
      summary: originalSummary,
      titleZh: sanitizeText(titleZh, 220),
      summaryZh: sanitizeText(summaryZh, 360),
      quality: "rule"
    };
  });
}

module.exports = async function handler(req, res) {
  if (req.method && req.method.toUpperCase() !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const locale = normalizeLocale(body.locale);
  const items = Array.isArray(body.items) ? body.items.slice(0, 12) : [];
  if (items.length === 0) {
    res.status(400).json({ ok: false, error: "empty_items" });
    return;
  }

  if (locale !== "zh-CN") {
    res.status(200).json({
      ok: true,
      quality: "passthrough",
      items: items.map((item) => ({
        id: String(item?.id || ""),
        title: sanitizeText(item?.title, 220),
        summary: sanitizeText(item?.summary, 360),
        titleZh: sanitizeText(item?.title, 220),
        summaryZh: sanitizeText(item?.summary, 360),
        quality: "passthrough"
      }))
    });
    return;
  }

  const translated = translateWithRules(items);
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  res.status(200).json({
    ok: true,
    quality: "rule",
    items: translated
  });
};
