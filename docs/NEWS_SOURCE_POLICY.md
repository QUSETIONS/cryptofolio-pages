# NEWS_SOURCE_POLICY

## Scope
This policy defines what news sources CryptoFolio can ingest for the `news-feed` pipeline.

## Allowed Sources
1. Public RSS feeds with explicit outbound article URLs.
2. Licensed provider APIs configured by environment variables (`NEWS_API_KEY`, `GNEWS_API_KEY`).

## Disallowed Sources
1. Paywalled full-content scraping.
2. Authenticated user-content scraping.
3. Sources that prohibit automated access in robots or terms.
4. Full-text republication from third-party media.

## Data Handling Rules
1. Store only structured metadata:
- title
- summary snippet
- source
- URL
- published timestamp
- tags/symbol hints
2. Always keep original source URL.
3. Do not rewrite as investment instruction.
4. Mark degraded quality state when source coverage is partial/stale.

## Compliance and Runtime Controls
1. Respect provider/API terms and quotas.
2. Use cache snapshots to reduce repeated source pressure.
3. Keep crawler user-agent explicit.
4. Return structured error codes when provider config is missing.

## Operational Checklist
1. Verify source remains reachable and legally usable.
2. Verify schema compatibility after source changes.
3. Run parser tests before deployment.
4. Confirm `/api/news-feed` degraded states are still explicit.
