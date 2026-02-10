const COINGECKO_API = "https://api.coingecko.com/api/v3/ping";
const YAHOO_TEST_API = "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=1d&interval=1d";

async function withTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { ok: response.ok, status: response.status };
  } catch (_error) {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(_req, res) {
  const [coingecko, yahoo] = await Promise.all([
    withTimeout(COINGECKO_API, 2500),
    withTimeout(YAHOO_TEST_API, 2500)
  ]);

  const ok = coingecko.ok || yahoo.ok;
  const body = {
    ok,
    version: "2026-02-09-public-stability-v1",
    timestamp: Date.now(),
    services: {
      coingecko,
      yahoo
    }
  };

  res.setHeader("Cache-Control", "no-store");
  res.status(ok ? 200 : 503).json(body);
};
