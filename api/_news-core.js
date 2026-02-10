const NEWS_API_URL = "https://newsapi.org/v2/top-headlines";
const GNEWS_API_URL = "https://gnews.io/api/v4/top-headlines";

const MAX_ITEMS = 50;
const TOPIC_MAP = {
  all: "business",
  macro: "business",
  crypto: "technology",
  rates: "business"
};

const RSS_SOURCES = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", topics: ["crypto"] },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", topics: ["crypto"] },
  { name: "CNBC Markets", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", topics: ["macro", "rates"] },
  { name: "Investing.com News", url: "https://www.investing.com/rss/news.rss", topics: ["macro", "rates"] }
];

function normalizeLocale(locale) {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

function providerLang(locale) {
  return normalizeLocale(locale) === "zh-CN" ? "zh" : "en";
}

function normalizeTopic(topic) {
  return ["all", "macro", "crypto", "rates"].includes(topic) ? topic : "all";
}

function normalizeLimit(limit) {
  const value = Number(limit);
  if (!Number.isFinite(value)) return 20;
  return Math.min(MAX_ITEMS, Math.max(1, Math.round(value)));
}

function normalizeSince(since) {
  return ["1h", "24h", "7d"].includes(since) ? since : "24h";
}

function cutoffTimestamp(since) {
  const now = Date.now();
  if (since === "1h") return now - 60 * 60 * 1000;
  if (since === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  return now - 24 * 60 * 60 * 1000;
}

function sanitizeText(input, maxLen = 420) {
  return String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function safeUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!/^https?:\/\//i.test(value)) return "";
  return value.slice(0, 900);
}

function extractTopics(text) {
  const lower = text.toLowerCase();
  const topics = [];
  if (/(fed|rate|yield|inflation|treasury|bond|dxy)/.test(lower)) topics.push("rates");
  if (/(bitcoin|ethereum|crypto|blockchain|etf|solana|xrp|bnb)/.test(lower)) topics.push("crypto");
  if (/(macro|economy|recession|gdp|labor|pmi|cpi|policy|stocks|equity)/.test(lower)) topics.push("macro");
  if (topics.length === 0) topics.push("macro");
  return [...new Set(topics)];
}

function extractSymbols(text) {
  const lower = text.toLowerCase();
  const symbols = [];
  const map = [
    ["bitcoin", "BTC"],
    ["ethereum", "ETH"],
    ["solana", "SOL"],
    ["xrp", "XRP"],
    ["bnb", "BNB"],
    ["gold", "XAU"],
    ["dxy", "DXY"],
    ["treasury", "UST10Y"],
    ["fed", "FED"],
    ["nasdaq", "NDX"],
    ["s&p", "SPX"]
  ];
  map.forEach(([keyword, symbol]) => {
    if (lower.includes(keyword)) symbols.push(symbol);
  });
  return [...new Set(symbols)];
}

function sentimentHintFromText(text) {
  const lower = text.toLowerCase();
  if (/(rally|surge|growth|beat|supportive|eases|improves|up|rebound)/.test(lower)) return "positive";
  if (/(crash|drop|fall|risk|hawkish|tightening|down|stress|selloff|recession)/.test(lower)) return "negative";
  return "neutral";
}

function normalizeArticle(article, provider, locale) {
  const title = sanitizeText(article?.title, 220);
  const summary = sanitizeText(article?.description || article?.content || "", 320);
  const url = safeUrl(article?.url);
  const source = sanitizeText(article?.source?.name || provider, 120);
  const publishedAt = Number(new Date(article?.publishedAt || Date.now()).getTime());
  if (!title || !url || !Number.isFinite(publishedAt)) return null;
  const text = `${title} ${summary}`;
  return {
    id: `${provider}-${Buffer.from(`${title}-${publishedAt}`).toString("base64").slice(0, 20)}`,
    title,
    summary,
    url,
    source,
    publishedAt,
    lang: normalizeLocale(locale),
    topics: extractTopics(text),
    symbols: extractSymbols(text),
    sentimentHint: sentimentHintFromText(text),
    quality: "fresh"
  };
}

function dedupeItems(items) {
  const seen = new Set();
  const deduped = [];
  items.forEach(item => {
    const key = `${item.url}::${item.title.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });
  return deduped;
}

function parseRssItems(xmlText, source, locale) {
  const xml = String(xmlText || "");
  const segments = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return segments
    .map(segment => {
      const title = decodeXmlEntities((segment.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "");
      const description = decodeXmlEntities((segment.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || "");
      const link = decodeXmlEntities((segment.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "");
      const pubDate = decodeXmlEntities((segment.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
      return normalizeArticle({
        title,
        description,
        url: link,
        source: { name: source.name },
        publishedAt: pubDate || Date.now()
      }, source.name, locale);
    })
    .filter(Boolean);
}

async function fetchNewsApiItems({ apiKey, locale, topic, limit }) {
  if (!apiKey) return [];
  const url = new URL(NEWS_API_URL);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("language", providerLang(locale));
  url.searchParams.set("category", TOPIC_MAP[topic] || "business");
  url.searchParams.set("pageSize", String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`newsapi_failed_${res.status}`);
  const json = await res.json();
  const raw = Array.isArray(json?.articles) ? json.articles : [];
  return raw.map(item => normalizeArticle(item, "NewsAPI", locale)).filter(Boolean);
}

async function fetchGNewsItems({ apiKey, locale, topic, limit }) {
  if (!apiKey) return [];
  const url = new URL(GNEWS_API_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("lang", providerLang(locale));
  url.searchParams.set("topic", TOPIC_MAP[topic] || "business");
  url.searchParams.set("max", String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`gnews_failed_${res.status}`);
  const json = await res.json();
  const raw = Array.isArray(json?.articles) ? json.articles : [];
  return raw.map(item => normalizeArticle(item, "GNews", locale)).filter(Boolean);
}

async function fetchRssCrawlerItems({ locale, topic, limit }) {
  const enabled = String(process.env.NEWS_CRAWLER_ENABLED || "1") !== "0";
  if (!enabled) return [];
  const sources = RSS_SOURCES.filter(source => topic === "all" || source.topics.includes(topic));
  const settled = await Promise.allSettled(
    sources.map(async source => {
      const response = await fetch(source.url, {
        headers: {
          "User-Agent": "CryptoFolioNewsCrawler/1.0 (+https://crypto-portfolio-tracker-tan-nine.vercel.app)"
        }
      });
      if (!response.ok) throw new Error(`rss_failed_${source.name}_${response.status}`);
      const text = await response.text();
      return parseRssItems(text, source, locale);
    })
  );
  const merged = [];
  settled.forEach(item => {
    if (item.status !== "fulfilled") return;
    merged.push(...item.value);
  });
  return dedupeItems(merged).slice(0, limit);
}

async function readCachedSnapshot() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  try {
    const response = await fetch(`${url}/get/cryptofolio:news_snapshot_v1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload || !payload.result) return null;
    const parsed = JSON.parse(payload.result);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

async function writeCachedSnapshot(snapshot) {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return;
  try {
    await fetch(`${url}/setex/cryptofolio:news_snapshot_v1/1800/${encodeURIComponent(JSON.stringify(snapshot))}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (_error) {
    // ignore cache write failures
  }
}

module.exports = {
  MAX_ITEMS,
  RSS_SOURCES,
  normalizeLocale,
  normalizeTopic,
  normalizeLimit,
  normalizeSince,
  cutoffTimestamp,
  sanitizeText,
  normalizeArticle,
  dedupeItems,
  parseRssItems,
  fetchNewsApiItems,
  fetchGNewsItems,
  fetchRssCrawlerItems,
  readCachedSnapshot,
  writeCachedSnapshot
};
