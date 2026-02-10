const MAX_EVENTS = 40;

function normalizeLocale(locale) {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

function normalizeWindow(windowKey) {
  return windowKey === "1d" ? "1d" : "7d";
}

function normalizeImportance(importance) {
  return importance === "high" ? "high" : "all";
}

function buildEvents(locale, windowKey) {
  const now = Date.now();
  const endTs = now + (windowKey === "1d" ? 24 : 7 * 24) * 60 * 60 * 1000;
  const rows = [
    {
      id: "event-fed-rate",
      title: locale === "zh-CN" ? "美联储利率决议" : "FOMC Rate Decision",
      country: "US",
      timestamp: now + 6 * 60 * 60 * 1000,
      importance: "high",
      consensus: "5.25%",
      previous: "5.25%",
      category: "rates",
      relatedAssets: ["BTC", "ETH", "DXY"]
    },
    {
      id: "event-us-cpi",
      title: locale === "zh-CN" ? "美国 CPI 同比" : "US CPI YoY",
      country: "US",
      timestamp: now + 28 * 60 * 60 * 1000,
      importance: "high",
      consensus: "3.1%",
      previous: "3.3%",
      category: "inflation",
      relatedAssets: ["BTC", "XAU", "DXY"]
    },
    {
      id: "event-us-nfp",
      title: locale === "zh-CN" ? "美国非农就业" : "US Nonfarm Payrolls",
      country: "US",
      timestamp: now + 46 * 60 * 60 * 1000,
      importance: "high",
      consensus: "190K",
      previous: "187K",
      category: "labor",
      relatedAssets: ["BTC", "ETH", "SPX"]
    },
    {
      id: "event-china-pmi",
      title: locale === "zh-CN" ? "中国制造业 PMI" : "China Manufacturing PMI",
      country: "CN",
      timestamp: now + 64 * 60 * 60 * 1000,
      importance: "medium",
      consensus: "50.2",
      previous: "49.9",
      category: "growth",
      relatedAssets: ["BTC", "XAU"]
    },
    {
      id: "event-us-10y-auction",
      title: locale === "zh-CN" ? "美国10年期国债拍卖" : "US 10Y Treasury Auction",
      country: "US",
      timestamp: now + 20 * 60 * 60 * 1000,
      importance: "medium",
      consensus: "4.20%",
      previous: "4.28%",
      category: "rates",
      relatedAssets: ["UST10Y", "DXY", "BTC"]
    }
  ];

  return rows.filter(item => item.timestamp <= endTs).slice(0, MAX_EVENTS);
}

module.exports = async function handler(req, res) {
  const locale = normalizeLocale(req.query?.locale);
  const windowKey = normalizeWindow(req.query?.window);
  const importance = normalizeImportance(req.query?.importance);

  let events = buildEvents(locale, windowKey);
  if (importance === "high") {
    events = events.filter(item => item.importance === "high");
  }

  const quality = events.length > 0 ? "fresh" : "stale";
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  res.status(200).json({
    ok: true,
    updatedAt: Date.now(),
    quality,
    locale,
    window: windowKey,
    importance,
    sources: ["calendar-fallback"],
    events
  });
};

module.exports._internals = {
  normalizeLocale,
  normalizeWindow,
  normalizeImportance,
  buildEvents
};

