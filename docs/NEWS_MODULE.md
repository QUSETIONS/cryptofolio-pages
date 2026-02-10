# NEWS_MODULE

## Purpose
- Add near real-time finance headlines and structured AI interpretation to support portfolio risk decisions.
- Keep output as decision-support only, not trading instructions.

## Data Flow
1. Frontend requests `GET /api/news-feed`.
2. Serverless aggregator pulls configured providers, normalizes fields, deduplicates, and returns quality metadata.
3. Frontend sends top headlines to `POST /api/news-insight`.
4. Insight endpoint returns structured JSON (LLM when available, rules fallback otherwise).
5. Frontend caches both feed and insight in localStorage for outage fallback.

## Quality and Fallback
- Quality tags: `fresh`, `delayed`, `stale`, `partial`.
- On feed failure, frontend falls back to `cryptofolio_news_snapshot_v1`.
- On insight failure, endpoint falls back to rule-based interpretation.
- Public diagnostics snapshot is written to `cryptofolio_news_public_status_v1` for `status.html`.

## Security and Guardrails
- Provider content is text-sanitized before rendering.
- Insight output is schema-constrained.
- Endpoint has per-IP rate limiting.
- No buy/sell instructions are generated.

## Public Contracts
- `GET /api/news-feed?locale&limit&topic&since`
  - Response: `{ ok, updatedAt, quality, topic, since, locale, sources, items[] }`
- `POST /api/news-insight`
  - Request: `{ locale, newsItems[], portfolioContext }`
  - Response: `{ ok, mode, asOf, headlineSummary, keyRisks[], affectedAssets[], regimeImpact, confidence, limitations[] }`

## UI Notes
- Dashboard and `#/news` share the same feed/insight module.
- Brief vs pro mode changes structural density:
  - Brief: shorter lists.
  - Pro: extended risks/assets/limitations.
