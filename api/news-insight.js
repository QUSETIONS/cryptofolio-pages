const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const REQUEST_LOG = new Map();

function normalizeLocale(locale) {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

function sanitizeText(input, maxLen = 320) {
  return String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ipFromReq(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function allowRequest(ip) {
  const now = Date.now();
  const history = REQUEST_LOG.get(ip) || [];
  const recent = history.filter(ts => now - ts <= RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  REQUEST_LOG.set(ip, recent);
  return true;
}

function sentimentScore(items) {
  let score = 0;
  items.forEach(item => {
    if (item.sentimentHint === "positive") score += 1;
    if (item.sentimentHint === "negative") score -= 1;
  });
  return score;
}

function inferRegime(items) {
  const score = sentimentScore(items);
  if (score >= 2) return "risk-on";
  if (score <= -2) return "defensive";
  return "balanced";
}

function collectAffectedAssets(items) {
  const counts = new Map();
  items.forEach(item => {
    (item.symbols || []).forEach(symbol => {
      counts.set(symbol, (counts.get(symbol) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([symbol, count]) => ({ symbol, reason: `mentioned ${count} times` }));
}

function fallbackInsight(items, locale) {
  const top = items.slice(0, 3);
  const headlineSummary = locale === "zh-CN"
    ? `过去窗口内共 ${items.length} 条新闻，重点集中在 ${top.map(item => item.source).join(" / ") || "宏观与加密"}。`
    : `${items.length} recent headlines captured, with focus from ${top.map(item => item.source).join(" / ") || "macro and crypto"}.`;

  const regime = inferRegime(items);
  const keyRisks = locale === "zh-CN"
    ? [
        "短线波动可能因宏观数据发布而放大。",
        "流动性与美元方向可能主导风险偏好切换。",
        "单一币种集中度过高会放大回撤。"
      ]
    : [
        "Short-term volatility may expand around macro releases.",
        "Liquidity and dollar direction can dominate risk appetite shifts.",
        "High single-asset concentration amplifies drawdown risk."
      ];

  return {
    headlineSummary,
    keyRisks,
    affectedAssets: collectAffectedAssets(items),
    marketRegimeImpact: regime,
    confidence: clamp(items.length / 12, 0.35, 0.82),
    limitations: locale === "zh-CN"
      ? ["该解读基于新闻文本线索，不等于交易信号。", "缺少完整订单流和链上数据。"]
      : ["This interpretation is text-signal based, not a trading signal.", "Order-flow and on-chain context are not fully included."]
  };
}

function validateInsightShape(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.headlineSummary !== "string") return false;
  if (!Array.isArray(data.keyRisks)) return false;
  if (!Array.isArray(data.affectedAssets)) return false;
  if (!["risk-on", "balanced", "defensive"].includes(data.marketRegimeImpact)) return false;
  if (!Number.isFinite(Number(data.confidence))) return false;
  if (!Array.isArray(data.limitations)) return false;
  return true;
}

async function requestOpenAIInsight(items, locale, portfolioContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("openai_key_missing");

  const model = process.env.OPENAI_NEWS_MODEL || "gpt-4.1-mini";
  const prompt = [
    "You are a financial risk analyst assistant.",
    "Return strict JSON with keys:",
    "headlineSummary, keyRisks, affectedAssets, marketRegimeImpact, confidence, limitations.",
    "No buy/sell advice. Keep concise and factual.",
    `Locale: ${locale}`,
    `Portfolio context: ${JSON.stringify(portfolioContext || {}).slice(0, 1200)}`,
    `News items: ${JSON.stringify(items).slice(0, 8000)}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "news_insight",
          schema: {
            type: "object",
            properties: {
              headlineSummary: { type: "string" },
              keyRisks: { type: "array", items: { type: "string" } },
              affectedAssets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    reason: { type: "string" }
                  },
                  required: ["symbol", "reason"],
                  additionalProperties: false
                }
              },
              marketRegimeImpact: { type: "string", enum: ["risk-on", "balanced", "defensive"] },
              confidence: { type: "number" },
              limitations: { type: "array", items: { type: "string" } }
            },
            required: ["headlineSummary", "keyRisks", "affectedAssets", "marketRegimeImpact", "confidence", "limitations"],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`openai_failed_${response.status}`);
  }

  const json = await response.json();
  const raw = json?.output_text || "";
  const parsed = JSON.parse(raw);
  if (!validateInsightShape(parsed)) {
    throw new Error("openai_shape_invalid");
  }
  return parsed;
}

module.exports = async function handler(req, res) {
  if (req.method && req.method.toUpperCase() !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const ip = ipFromReq(req);
  if (!allowRequest(ip)) {
    res.status(429).json({ ok: false, error: "rate_limited" });
    return;
  }

  const body = req.body || {};
  const locale = normalizeLocale(body.locale);
  const items = Array.isArray(body.newsItems) ? body.newsItems.slice(0, 20) : [];
  const cleanItems = items.map(item => ({
    title: sanitizeText(item?.title, 200),
    summary: sanitizeText(item?.summary, 300),
    source: sanitizeText(item?.source, 60),
    topics: Array.isArray(item?.topics) ? item.topics.slice(0, 5) : [],
    symbols: Array.isArray(item?.symbols) ? item.symbols.slice(0, 5) : [],
    sentimentHint: ["positive", "negative", "neutral"].includes(item?.sentimentHint) ? item.sentimentHint : "neutral"
  })).filter(item => item.title);

  if (cleanItems.length === 0) {
    res.status(400).json({ ok: false, error: "empty_news_items" });
    return;
  }

  const portfolioContext = body.portfolioContext && typeof body.portfolioContext === "object"
    ? body.portfolioContext
    : {};

  let insight = null;
  let mode = "fallback";
  try {
    insight = await requestOpenAIInsight(cleanItems, locale, portfolioContext);
    mode = "llm";
  } catch (_error) {
    insight = fallbackInsight(cleanItems, locale);
    mode = "fallback";
  }

  const responseBody = {
    ok: true,
    mode,
    asOf: Date.now(),
    summary: insight.headlineSummary,
    headlineSummary: insight.headlineSummary,
    keyRisks: insight.keyRisks,
    affectedAssets: insight.affectedAssets,
    regimeImpact: insight.marketRegimeImpact,
    marketRegimeImpact: insight.marketRegimeImpact,
    confidence: clamp(Number(insight.confidence || 0.5), 0.2, 0.95),
    limitations: insight.limitations
  };

  res.setHeader("Cache-Control", "s-maxage=90, stale-while-revalidate=180");
  res.status(200).json(responseBody);
};

module.exports._internals = {
  normalizeLocale,
  fallbackInsight,
  validateInsightShape,
  inferRegime
};
