# News Crawler Setup

This project supports a hybrid news ingestion pipeline: provider APIs + RSS crawler.

## Overview

Endpoints:
- `GET /api/news-feed`
- `POST /api/news-crawl-run`

Core module:
- `api/_news-core.js`

Cache snapshot key:
- `cryptofolio:news_snapshot_v1` (Upstash Redis)

## Required/Optional Environment Variables

Required for provider mode (recommended):
- `NEWS_API_KEY`
- `GNEWS_API_KEY`

Optional crawler mode controls:
- `NEWS_CRAWLER_ENABLED=1` (default)
- `NEWS_CRAWLER_ENABLED=0` (disable RSS crawler)

Optional cache (recommended for production):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Behavior Matrix

- Provider keys configured: fetch from provider APIs (+ RSS if enabled), then dedupe.
- No provider keys + crawler enabled: fetch RSS crawler only.
- No provider keys + crawler disabled: return
  - `ok: false`
  - `code: NEWS_PROVIDER_NOT_CONFIGURED`

When live fetch fails/returns empty:
- Try cached snapshot.
- If cache exists: return stale snapshot with `quality: "stale"`.
- If cache missing: return `ok: false`, `code: NEWS_EMPTY`.

## Response Shape

Success:
```json
{
  "ok": true,
  "updatedAt": 1739200000000,
  "quality": "fresh",
  "topic": "all",
  "since": "24h",
  "locale": "en-US",
  "sources": ["NewsAPI", "GNews", "CrawlerRSS"],
  "items": []
}
```

Degraded:
```json
{
  "ok": false,
  "code": "NEWS_PROVIDER_NOT_CONFIGURED",
  "message": "...",
  "updatedAt": 1739200000000,
  "quality": "stale",
  "topic": "all",
  "since": "24h",
  "locale": "en-US",
  "sources": [],
  "items": []
}
```

## Manual Crawl Trigger

`POST /api/news-crawl-run`

Example:
```bash
curl -X POST "https://<your-domain>/api/news-crawl-run?locale=zh-CN&topic=all&limit=30"
```

## Vercel Cron (optional)

You can trigger `POST /api/news-crawl-run` every 5~10 minutes via Vercel Cron.

## Compliance Notes

- Crawl only publicly available RSS feeds.
- Keep source links and avoid republishing full content.
- Treat output as decision support, not investment advice.
- Follow source governance in `docs/NEWS_SOURCE_POLICY.md`.
