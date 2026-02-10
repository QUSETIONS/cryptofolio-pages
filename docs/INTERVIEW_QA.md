# CryptoFolio Interview Q&A (Technical Deep Dive)

## 1) 30-Second System Pitch

CryptoFolio is a frontend-first portfolio intelligence system for crypto asset tracking, risk evaluation, alerting, and macro regime analysis.  
It uses a modular vanilla JS architecture, deterministic rendering, explicit dependency injection in controllers, and production-grade quality gates (syntax checks, unit tests, E2E, public smoke checks).

---

## 2) Architecture: What Is Split and Why

### Layer boundaries
- `app.js`: minimal bootstrap entry.
- `js/app-orchestrator.js`: composition root + lifecycle wiring.
- `js/domain-portfolio.js`: pure portfolio/risk math.
- `js/storage.js`: persistence, import normalization, safe parsing.
- `js/controllers.js`: user action handlers (DI-based).
- `js/ui-renderers.js`: escaped HTML rendering.
- `js/macro-*`: macro data adapter/scoring/explainer/runtime module.
- `api/macro-snapshot.js`: serverless data proxy.
- `api/health.js`: runtime health contract endpoint.

### Why this split
- Testability: domain math and adapters are unit-test friendly.
- Failure isolation: data fetch, scoring, rendering, and storage failures are decoupled.
- Interview defensibility: each module has one clear responsibility.

---

## 3) Typical “Hard Questions” and Defensible Answers

### Q1: Why not React/Vue?
Answer:
- Scope was reliability + productization under strict timeline.
- Existing code was already modular; migration cost would be high with limited product gain.
- We focused on boundaries, testability, and deployment quality first.

### Q2: How do you prevent XSS in import/render paths?
Answer:
- Import path normalizes and sanitizes payload before commit.
- Render path escapes untrusted string fields before injecting HTML.
- Unknown/invalid structures are dropped, counted, and surfaced in import summary.

### Q3: How do you control accidental destructive actions?
Answer:
- Dangerous actions are gated by async custom confirm dialog (not raw `window.confirm`).
- This supports accessible focus control and consistent UX behavior.

### Q4: How do you prove deploy quality?
Answer:
- `ci:all` validates syntax + modules + unit + critical E2E.
- `check:public` validates production endpoints and health schema.
- `test:e2e:deploy-smoke` validates production DOM and API behavior.
- `release:verify` combines public checks into one command.

### Q5: How do you handle flaky network/API failure?
Answer:
- Runtime fallback to cached portfolio/macro snapshot.
- Banner + toast communicate degraded mode clearly.
- Public deploy smoke includes bounded retry for transient navigation failures.

### Q6: Why a serverless proxy for macro data?
Answer:
- Avoids frontend CORS/multi-source inconsistency.
- Normalizes heterogeneous upstream payloads into one stable contract.
- Enables cache strategy and health observability via backend edge.

### Q7: How do you avoid “pseudo mode toggle” in macro analysis?
Answer:
- `brief` and `pro` use different render contracts and visible sections.
- `brief`: concise summary and reminder.
- `pro`: factor decomposition, evidence lines, methodology, limitations.
- E2E enforces visible DOM differences.

### Q8: How do you make runtime failures diagnosable?
Answer:
- Global error boundary captures `error` and `unhandledrejection`.
- Diagnostic IDs are emitted and logged.
- Runtime logs include `route/hash` for faster issue localization.
- `/status` page shows health state + recent runtime and macro status.

### Q9: How do you ensure i18n is real, not superficial?
Answer:
- UI strings come from locale dictionaries, not scattered literals.
- Number/time formatting follows locale-aware formatters.
- Dedicated check (`check:i18n-literals`) prevents hardcoded string regressions.

### Q10: What are known limitations?
Answer:
- Pure frontend storage model (no multi-user backend persistence).
- Macro model is regime-support heuristic, not predictive trading engine.
- Single-region static/serverless deployment path (no multi-region failover yet).

---

## 4) Reliability Contract You Can Quote

### Public endpoints
- `/` main app
- `/open` social-app bridge page
- `/status` runtime status page
- `/api/health` health contract endpoint
- `/robots.txt`
- `/sitemap.xml`

### `/api/health` schema
```json
{
  "ok": true,
  "version": "string",
  "timestamp": 0,
  "services": {
    "coingecko": { "ok": true, "status": 200 },
    "yahoo": { "ok": true, "status": 200 }
  }
}
```

---

## 5) Live Demo Under Pressure (3-5 min)

### 3-minute version
1. Dashboard: total value + risk KPIs + macro regime badge.
2. Settings: switch locale and show format consistency.
3. Reliability: open `/status`, explain service health + fallback design.

### 5-minute version
1. Load demo data, explain data flow and normalization.
2. Show macro `brief` vs `pro` mode differences.
3. Trigger offline/degraded explanation and fallback behavior.
4. Show `release:verify` command path for production confidence.

---

## 6) Commands Worth Memorizing

```bash
npm run ci:all
npm run check:public -- --base-url https://crypto-portfolio-tracker-tan-nine.vercel.app
npm run release:verify -- --base-url https://crypto-portfolio-tracker-tan-nine.vercel.app
```

---

## 7) One-Line Positioning

CryptoFolio is a modular frontend portfolio intelligence system with production-focused reliability, explainable macro analytics, and verifiable deployment quality.

---

## 8) New Decision Modules Q&A

### Q11: Why Strategy Lab instead of auto-rebalance execution?
Answer:
- The current scope is decision support, not order execution.
- We prioritize transparent trade suggestions (`BUY/SELL/HOLD`) and explicit constraints.
- This reduces operational and compliance risk in a frontend-only architecture.

### Q12: Why scenario stress testing over predictive models?
Answer:
- Scenario analysis is deterministic, explainable, and auditable.
- Predictive models require larger datasets, model governance, and drift monitoring.
- For a client-side system, scenario-based sensitivity gives higher reliability per unit complexity.

### Q13: How do you ensure attribution remains interpretable?
Answer:
- Attribution uses direct contribution formulas from position value and observed return changes.
- 24h/7d windows are explicit and user-selectable.
- Output separates return contribution and volatility contribution to avoid mixed signals.
