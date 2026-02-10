# Cloudflare Quick Deploy (Workers Proxy)

This project can be published on Cloudflare without changing the frontend build by deploying a Worker proxy.

## What it does

- Publishes a `*.workers.dev` URL.
- Proxies all traffic to the current production origin:
  - `https://crypto-portfolio-tracker-tan-nine.vercel.app`
- Helps bypass networks that block or poison `*.vercel.app` DNS.

## Prerequisites

1. Cloudflare account access.
2. Wrangler authenticated:
   - `npm run cf:whoami`
3. Optional (recommended in CI): set `CLOUDFLARE_API_TOKEN`.

## Deploy

```bash
npm run deploy:cloudflare
```

Wrangler prints the live `workers.dev` URL after deployment.

## Verify

```bash
curl -I https://<your-worker>.workers.dev/
curl -s https://<your-worker>.workers.dev/api/health
```

## Notes

- `wrangler.toml` sets `ORIGIN_URL`; update it if production origin changes.
- Response headers include:
  - `x-cryptofolio-edge: cloudflare-proxy`
  - `x-cryptofolio-origin: <origin host>`
