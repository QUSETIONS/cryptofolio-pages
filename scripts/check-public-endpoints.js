const REQUIRED_ENDPOINTS = [
  "/",
  "/open",
  "/status",
  "/api/health",
  "/api/news-feed?topic=all&since=24h&limit=5&locale=en-US",
  "/api/econ-calendar?window=7d&importance=all&locale=en-US",
  "/robots.txt",
  "/sitemap.xml"
];

function readBaseUrlFromArgs() {
  const index = process.argv.indexOf("--base-url");
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return process.env.PUBLIC_BASE_URL || "";
}

function normalizeBaseUrl(input) {
  if (!input) return "";
  return input.replace(/\/+$/, "");
}

function assertHealthSchema(body) {
  if (!body || typeof body !== "object") {
    throw new Error("health schema invalid: body must be object");
  }
  if (typeof body.ok !== "boolean") {
    throw new Error("health schema invalid: ok must be boolean");
  }
  if (typeof body.version !== "string" || body.version.length === 0) {
    throw new Error("health schema invalid: version must be non-empty string");
  }
  if (!Number.isFinite(Number(body.timestamp))) {
    throw new Error("health schema invalid: timestamp must be number");
  }
  if (!body.services || typeof body.services !== "object" || Array.isArray(body.services)) {
    throw new Error("health schema invalid: services must be object");
  }
  Object.entries(body.services).forEach(([name, value]) => {
    if (!value || typeof value !== "object") {
      throw new Error(`health schema invalid: services.${name} must be object`);
    }
    if (typeof value.ok !== "boolean") {
      throw new Error(`health schema invalid: services.${name}.ok must be boolean`);
    }
    if (!Number.isFinite(Number(value.status))) {
      throw new Error(`health schema invalid: services.${name}.status must be number`);
    }
  });
}

function assertNewsSchema(body) {
  if (!body || typeof body !== "object") {
    throw new Error("news schema invalid: body must be object");
  }
  if (typeof body.ok !== "boolean") {
    throw new Error("news schema invalid: ok must be boolean");
  }
  if (!["fresh", "delayed", "stale", "partial"].includes(String(body.quality || ""))) {
    throw new Error("news schema invalid: quality must be fresh/delayed/stale/partial");
  }
  if (!Number.isFinite(Number(body.updatedAt))) {
    throw new Error("news schema invalid: updatedAt must be number");
  }
  if (!Array.isArray(body.items)) {
    throw new Error("news schema invalid: items must be array");
  }
  if (body.ok === false) {
    if (typeof body.code !== "string" || body.code.length === 0) {
      throw new Error("news schema invalid: code required when ok=false");
    }
    return;
  }
  body.items.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`news schema invalid: items[${index}] must be object`);
    }
    if (typeof item.id !== "string" || item.id.length === 0) {
      throw new Error(`news schema invalid: items[${index}].id must be non-empty string`);
    }
    if (typeof item.title !== "string" || item.title.length === 0) {
      throw new Error(`news schema invalid: items[${index}].title must be non-empty string`);
    }
    if (typeof item.url !== "string" || !/^https?:\/\//i.test(item.url)) {
      throw new Error(`news schema invalid: items[${index}].url must be http(s) URL`);
    }
    if (!Number.isFinite(Number(item.publishedAt))) {
      throw new Error(`news schema invalid: items[${index}].publishedAt must be number`);
    }
    if (!Array.isArray(item.topics)) {
      throw new Error(`news schema invalid: items[${index}].topics must be array`);
    }
  });
}

function assertCalendarSchema(body) {
  if (!body || typeof body !== "object") {
    throw new Error("calendar schema invalid: body must be object");
  }
  if (typeof body.ok !== "boolean") {
    throw new Error("calendar schema invalid: ok must be boolean");
  }
  if (!Number.isFinite(Number(body.updatedAt))) {
    throw new Error("calendar schema invalid: updatedAt must be number");
  }
  if (!Array.isArray(body.events)) {
    throw new Error("calendar schema invalid: events must be array");
  }
  body.events.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`calendar schema invalid: events[${index}] must be object`);
    }
    if (typeof item.id !== "string" || !item.id) {
      throw new Error(`calendar schema invalid: events[${index}].id required`);
    }
    if (typeof item.title !== "string" || !item.title) {
      throw new Error(`calendar schema invalid: events[${index}].title required`);
    }
    if (!Number.isFinite(Number(item.timestamp))) {
      throw new Error(`calendar schema invalid: events[${index}].timestamp must be number`);
    }
  });
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(readBaseUrlFromArgs());
  if (!baseUrl) {
    throw new Error("Missing base URL. Use --base-url <url> or set PUBLIC_BASE_URL.");
  }

  for (const path of REQUIRED_ENDPOINTS) {
    const url = `${baseUrl}${path}`;
    const response = await fetchWithTimeout(url, 12000);
    const status = response.status;
    if (path === "/api/health") {
      if (![200, 503].includes(status)) {
        throw new Error(`${path} expected status 200/503, got ${status}`);
      }
      const body = await response.json();
      assertHealthSchema(body);
      continue;
    }
    if (path.startsWith("/api/news-feed")) {
      if (status !== 200) {
        throw new Error(`${path} expected status 200, got ${status}`);
      }
      const body = await response.json();
      assertNewsSchema(body);
      continue;
    }
    if (path.startsWith("/api/econ-calendar")) {
      if (status !== 200) {
        throw new Error(`${path} expected status 200, got ${status}`);
      }
      const body = await response.json();
      assertCalendarSchema(body);
      continue;
    }
    if (status !== 200) {
      throw new Error(`${path} expected status 200, got ${status}`);
    }
    if (path === "/status") {
      const html = await response.text();
      if (!html.includes("CryptoFolio Status") || !html.includes("Service Health")) {
        throw new Error("/status content validation failed");
      }
    }
  }

  console.log(`check-public-endpoints passed for ${baseUrl}`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
