const {
  normalizeLocale,
  normalizeTopic,
  normalizeLimit,
  normalizeSince,
  cutoffTimestamp,
  dedupeItems,
  fetchNewsApiItems,
  fetchGNewsItems,
  fetchRssCrawlerItems,
  readCachedSnapshot,
  writeCachedSnapshot,
  sanitizeText
} = require("./_news-core");

module.exports = async function handler(req, res) {
  const locale = normalizeLocale(req.query?.locale);
  const topic = normalizeTopic(req.query?.topic);
  const limit = normalizeLimit(req.query?.limit);
  const since = normalizeSince(req.query?.since);
  const sinceTs = cutoffTimestamp(since);

  const newsApiKey = process.env.NEWS_API_KEY || "";
  const gnewsApiKey = process.env.GNEWS_API_KEY || "";
  const hasConfiguredProvider = Boolean(newsApiKey || gnewsApiKey);
  const crawlerEnabled = String(process.env.NEWS_CRAWLER_ENABLED || "1") !== "0";

  if (!hasConfiguredProvider && !crawlerEnabled) {
    const message = locale === "zh-CN"
      ? "新闻服务未配置，请设置 NEWS_API_KEY / GNEWS_API_KEY，或启用 NEWS_CRAWLER_ENABLED。"
      : "News provider is not configured. Set NEWS_API_KEY/GNEWS_API_KEY, or enable NEWS_CRAWLER_ENABLED.";
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({
      ok: false,
      code: "NEWS_PROVIDER_NOT_CONFIGURED",
      message: sanitizeText(message, 200),
      updatedAt: Date.now(),
      quality: "stale",
      topic,
      since,
      locale,
      sources: [],
      items: []
    });
    return;
  }

  const settled = await Promise.allSettled([
    fetchNewsApiItems({ apiKey: newsApiKey, locale, topic, limit }),
    fetchGNewsItems({ apiKey: gnewsApiKey, locale, topic, limit }),
    fetchRssCrawlerItems({ locale, topic, limit })
  ]);

  const merged = [];
  const sources = [];
  settled.forEach(item => {
    if (item.status !== "fulfilled") return;
    merged.push(...item.value);
  });
  if (settled[0].status === "fulfilled" && settled[0].value.length > 0) sources.push("NewsAPI");
  if (settled[1].status === "fulfilled" && settled[1].value.length > 0) sources.push("GNews");
  if (settled[2].status === "fulfilled" && settled[2].value.length > 0) sources.push("CrawlerRSS");

  let items = dedupeItems(merged)
    .filter(item => item.publishedAt >= sinceTs)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, limit);

  if (topic !== "all") {
    items = items.filter(item => item.topics.includes(topic));
  }

  let quality = "fresh";
  if (settled.some(entry => entry.status === "rejected")) {
    quality = "partial";
  }

  if (items.length > 0) {
    const updatedAt = Date.now();
    await writeCachedSnapshot({
      ok: true,
      updatedAt,
      crawlUpdatedAt: updatedAt,
      crawlCount: items.length,
      lastErrorCode: "",
      quality,
      topic,
      since,
      locale,
      sources: [...new Set(sources)],
      items
    });
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({
      ok: true,
      updatedAt,
      crawlUpdatedAt: updatedAt,
      crawlCount: items.length,
      lastErrorCode: "",
      quality,
      topic,
      since,
      locale,
      sources: [...new Set(sources)],
      items
    });
    return;
  }

  const cached = await readCachedSnapshot();
  if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({
      ok: true,
      updatedAt: Number(cached.updatedAt || Date.now()),
      crawlUpdatedAt: Number(cached.crawlUpdatedAt || cached.updatedAt || Date.now()),
      crawlCount: Number(cached.crawlCount || cached.items.length || 0),
      lastErrorCode: String(cached.lastErrorCode || ""),
      quality: "stale",
      topic,
      since,
      locale,
      sources: Array.isArray(cached.sources) ? cached.sources : [],
      items: cached.items
    });
    return;
  }

  const code = !hasConfiguredProvider && !crawlerEnabled
    ? "NEWS_PROVIDER_NOT_CONFIGURED"
    : "NEWS_EMPTY";
  const message = code === "NEWS_PROVIDER_NOT_CONFIGURED"
    ? (locale === "zh-CN"
      ? "新闻服务未配置，请设置 NEWS_API_KEY / GNEWS_API_KEY，或启用 NEWS_CRAWLER_ENABLED。"
      : "News provider is not configured. Set NEWS_API_KEY/GNEWS_API_KEY, or enable NEWS_CRAWLER_ENABLED.")
    : (locale === "zh-CN"
      ? "当前时间窗口内暂无可用新闻，请稍后刷新。"
      : "No news available in current time window. Please refresh later.");

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  res.status(200).json({
    ok: false,
    code,
    message: sanitizeText(message, 200),
    updatedAt: Date.now(),
    crawlUpdatedAt: Date.now(),
    crawlCount: 0,
    lastErrorCode: code,
    quality: "stale",
    topic,
    since,
    locale,
    sources: [],
    items: []
  });
};

module.exports._internals = {
  normalizeLocale,
  normalizeTopic,
  normalizeSince,
  dedupeItems,
  sanitizeText
};
