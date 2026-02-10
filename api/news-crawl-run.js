const {
  normalizeLocale,
  normalizeTopic,
  normalizeLimit,
  dedupeItems,
  fetchNewsApiItems,
  fetchGNewsItems,
  fetchRssCrawlerItems,
  writeCachedSnapshot
} = require("./_news-core");

module.exports = async function handler(req, res) {
  const startedAt = Date.now();
  if (!["POST", "GET"].includes(req.method || "")) {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED" });
    return;
  }

  const locale = normalizeLocale(req.query?.locale || req.body?.locale);
  const topic = normalizeTopic(req.query?.topic || req.body?.topic);
  const limit = normalizeLimit(req.query?.limit || req.body?.limit || 30);

  const newsApiKey = process.env.NEWS_API_KEY || "";
  const gnewsApiKey = process.env.GNEWS_API_KEY || "";

  const settled = await Promise.allSettled([
    fetchNewsApiItems({ apiKey: newsApiKey, locale, topic, limit }),
    fetchGNewsItems({ apiKey: gnewsApiKey, locale, topic, limit }),
    fetchRssCrawlerItems({ locale, topic, limit })
  ]);

  const merged = [];
  const sources = [];
  const providerErrors = [];
  settled.forEach(item => {
    if (item.status !== "fulfilled") return;
    merged.push(...item.value);
  });
  if (settled[0].status === "fulfilled" && settled[0].value.length > 0) sources.push("NewsAPI");
  if (settled[1].status === "fulfilled" && settled[1].value.length > 0) sources.push("GNews");
  if (settled[2].status === "fulfilled" && settled[2].value.length > 0) sources.push("CrawlerRSS");
  if (settled[0].status === "rejected") providerErrors.push({ provider: "NewsAPI", message: String(settled[0].reason?.message || "provider_failed") });
  if (settled[1].status === "rejected") providerErrors.push({ provider: "GNews", message: String(settled[1].reason?.message || "provider_failed") });
  if (settled[2].status === "rejected") providerErrors.push({ provider: "CrawlerRSS", message: String(settled[2].reason?.message || "provider_failed") });

  const items = dedupeItems(merged)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, limit);

  if (items.length > 0) {
    const updatedAt = Date.now();
    await writeCachedSnapshot({
      ok: true,
      updatedAt,
      crawlUpdatedAt: updatedAt,
      crawlCount: items.length,
      lastErrorCode: providerErrors[0]?.provider || "",
      quality: "fresh",
      topic,
      since: "24h",
      locale,
      sources: [...new Set(sources)],
      items
    });
  }

  res.status(200).json({
    ok: true,
    updatedAt: Date.now(),
    count: items.length,
    sources: [...new Set(sources)],
    quality: settled.some(entry => entry.status === "rejected") ? "partial" : "fresh",
    durationMs: Date.now() - startedAt,
    providerErrors
  });
};
