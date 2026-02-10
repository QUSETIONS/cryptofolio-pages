import fs from "node:fs/promises";
import path from "node:path";

const ORIGIN = process.env.CRYPTOFOLIO_ORIGIN || "https://crypto-portfolio-tracker-tan-nine.vercel.app";
const OUT_DIR = path.resolve(process.cwd(), "data", "api");

async function ensureOutDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "accept": "application/json" } });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function writeJson(filename, payload) {
  const target = path.join(OUT_DIR, filename);
  const body = JSON.stringify(payload, null, 2);
  await fs.writeFile(target, `${body}\n`, "utf8");
  return target;
}

async function pull() {
  await ensureOutDir();
  const jobs = [
    { file: "health.json", url: `${ORIGIN}/api/health` },
    { file: "macro-snapshot-30D.json", url: `${ORIGIN}/api/macro-snapshot?window=30D` },
    { file: "macro-snapshot-90D.json", url: `${ORIGIN}/api/macro-snapshot?window=90D` },
    { file: "news-feed-all-24h-en-US.json", url: `${ORIGIN}/api/news-feed?topic=all&since=24h&limit=50&locale=en-US` },
    { file: "news-feed-all-24h-zh-CN.json", url: `${ORIGIN}/api/news-feed?topic=all&since=24h&limit=50&locale=zh-CN` },
    { file: "econ-calendar-7d-all-en-US.json", url: `${ORIGIN}/api/econ-calendar?window=7d&importance=all&locale=en-US` },
    { file: "econ-calendar-7d-all-zh-CN.json", url: `${ORIGIN}/api/econ-calendar?window=7d&importance=all&locale=zh-CN` }
  ];

  const results = [];
  for (const job of jobs) {
    try {
      const json = await fetchJson(job.url);
      await writeJson(job.file, json);
      results.push({ file: job.file, ok: true });
      console.log(`[snapshot] wrote ${job.file}`);
    } catch (error) {
      results.push({ file: job.file, ok: false, error: error instanceof Error ? error.message : String(error) });
      console.error(`[snapshot] failed ${job.file}:`, error instanceof Error ? error.message : error);
    }
  }

  const okCount = results.filter(item => item.ok).length;
  const failCount = results.length - okCount;
  console.log(`[snapshot] done: ${okCount} ok, ${failCount} failed`);
  if (okCount === 0) {
    throw new Error("No snapshots refreshed.");
  }
}

pull().catch(error => {
  console.error("[snapshot] fatal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
