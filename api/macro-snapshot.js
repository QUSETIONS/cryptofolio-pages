const COINGECKO_API = "https://api.coingecko.com/api/v3";
const YAHOO_CHART_API = "https://query1.finance.yahoo.com/v8/finance/chart";

const SERIES_CONFIG = [
  { id: "crypto_btc", label: "Bitcoin", category: "crypto", yahooSymbol: "BTC-USD" },
  { id: "equity_sp500", label: "S&P 500", category: "equity", yahooSymbol: "^GSPC" },
  { id: "dollar_dxy", label: "US Dollar Index", category: "fx", yahooSymbol: "DX-Y.NYB" },
  { id: "rates_ust10y", label: "US 10Y Yield", category: "rates", yahooSymbol: "^TNX" },
  { id: "gold_xau", label: "Gold", category: "commodity", yahooSymbol: "GC=F" }
];

function normalizeWindow(windowKey) {
  return windowKey === "90D" ? "90D" : "30D";
}

function toYahooRange(windowKey) {
  return windowKey === "90D" ? "3mo" : "1mo";
}

async function fetchCoinGeckoGlobal() {
  const res = await fetch(`${COINGECKO_API}/global`);
  if (!res.ok) throw new Error("coingecko_global_failed");
  const json = await res.json();
  const data = json?.data || {};
  return {
    totalMarketCapUsd: Number(data?.total_market_cap?.usd || 0),
    totalVolumeUsd: Number(data?.total_volume?.usd || 0),
    marketCapChange24h: Number(data?.market_cap_change_percentage_24h_usd || 0),
    btcDominance: Number(data?.market_cap_percentage?.btc || 0)
  };
}

async function fetchYahooSeries(symbol, windowKey) {
  const range = toYahooRange(windowKey);
  const url = `${YAHOO_CHART_API}/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`yahoo_failed_${symbol}`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const ts = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const close = Array.isArray(result?.indicators?.quote?.[0]?.close)
    ? result.indicators.quote[0].close
    : [];
  const points = [];
  for (let i = 0; i < ts.length; i += 1) {
    const timestamp = Number(ts[i]);
    const value = Number(close[i]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(value)) continue;
    points.push({ ts: timestamp * 1000, value });
  }
  return points;
}

function getQuality(availableSeriesCount, expectedSeriesCount, latestPointTs) {
  const completeness = expectedSeriesCount > 0 ? availableSeriesCount / expectedSeriesCount : 0;
  if (completeness < 1) return "partial";
  if (!Number.isFinite(latestPointTs)) return "stale";

  const ageMs = Date.now() - latestPointTs;
  const dayMs = 24 * 60 * 60 * 1000;
  if (ageMs <= dayMs) return "fresh";
  if (ageMs <= 3 * dayMs) return "delayed";
  return "stale";
}

module.exports = async function handler(req, res) {
  const windowKey = normalizeWindow(req.query?.window);
  const settled = await Promise.allSettled([
    fetchCoinGeckoGlobal(),
    ...SERIES_CONFIG.map(item => fetchYahooSeries(item.yahooSymbol, windowKey))
  ]);

  const globalResult = settled[0].status === "fulfilled" ? settled[0].value : null;
  const series = [];
  let latestPointTs = 0;

  for (let i = 0; i < SERIES_CONFIG.length; i += 1) {
    const cfg = SERIES_CONFIG[i];
    const result = settled[i + 1];
    if (result.status !== "fulfilled") continue;
    const points = result.value;
    if (!Array.isArray(points) || points.length === 0) continue;
    latestPointTs = Math.max(latestPointTs, points[points.length - 1].ts);
    series.push({
      id: cfg.id,
      label: cfg.label,
      category: cfg.category,
      source: "Yahoo Finance",
      points
    });
  }

  const payload = {
    window: windowKey,
    series,
    factors: {
      totalMarketCapUsd: globalResult?.totalMarketCapUsd ?? null,
      totalVolumeUsd: globalResult?.totalVolumeUsd ?? null,
      marketCapChange24h: globalResult?.marketCapChange24h ?? null,
      btcDominance: globalResult?.btcDominance ?? null
    },
    updatedAt: Date.now(),
    quality: getQuality(series.length, SERIES_CONFIG.length, latestPointTs),
    sources: ["Yahoo Finance", "CoinGecko"]
  };

  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  res.status(200).json(payload);
};
