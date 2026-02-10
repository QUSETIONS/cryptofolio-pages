# CryptoFolio

CryptoFolio is a portfolio intelligence system for tracking assets, evaluating risk, monitoring alerts, and understanding macro market conditions.

## Online Access
- Smart entry (recommended): `https://cdn.jsdelivr.net/gh/QUSETIONS/cryptofolio-pages@main/start.html`
- GitHub Pages: `https://qusetions.github.io/cryptofolio-pages/`
- GitHub CDN mirror: `https://cdn.jsdelivr.net/gh/QUSETIONS/cryptofolio-pages@main/index.html`
- Main URL: `https://crypto-portfolio-tracker-tan-nine.vercel.app`
- Share bridge URL: `https://crypto-portfolio-tracker-tan-nine.vercel.app/open`
- Status page: `https://crypto-portfolio-tracker-tan-nine.vercel.app/status`

## Core Capabilities
- Dashboard with KPI metrics, allocation, performance curve, and sparkline.
- Multi-view routing: Assets, Transactions, Risk, Alerts, Strategy, Stress, Attribution, Settings.
- Safe data import/export with normalization, validation, and sanitization.
- Bilingual experience (`en-US` / `zh-CN`) with locale-aware formatting.
- Macro panel with multi-asset risk curves and explainable scoring.
- Economic calendar with event importance filtering and cache fallback.
- Decision workspace aggregating macro/news/stress signals into risk posture suggestions.
- Decision modules: target allocation rebalance, stress scenario simulation, and risk attribution.
- Runtime resilience: error boundary, offline fallback, cache fallback.

## Tech Stack
- Vanilla JavaScript modules (`js/*.js`)
- Chart.js
- Vitest + Playwright
- Lighthouse CI
- Vercel serverless API

## Project Structure
- `app.js`: entrypoint.
- `js/app-orchestrator.js`: lifecycle and dependency wiring.
- `js/domain-portfolio.js`: portfolio domain calculations.
- `js/controllers.js`: action controllers.
- `js/ui-renderers.js`: renderer helpers and escaped output.
- `api/macro-snapshot.js`: macro market proxy endpoint.
- `api/health.js`: runtime health contract endpoint.
- `docs/`: deployment, architecture, screenshots, and metrics notes.

## Commands
```bash
npm run check:js
npm run check:modules
npm run check:i18n-literals
npm run check:app-size
npm run check:docs
npm run check:public -- --base-url https://crypto-portfolio-tracker-tan-nine.vercel.app
npm run test
npm run test:unit
npm run test:e2e:smoke
npm run test:e2e:strategy-stress-attribution
npm run release:verify -- --base-url https://crypto-portfolio-tracker-tan-nine.vercel.app
npm run ci:all
```

## Deployment
- Primary: Vercel (`vercel.json`)
- Backup: GitHub Pages
- Guide: `docs/DEPLOY.md`

## Documentation
- Architecture: `ARCHITECTURE.md`
- ADRs: `DECISIONS.md`
- Macro metric definitions: `docs/MACRO_METRICS.md`
- Technical Q&A: `docs/INTERVIEW_QA.md`
- Module roadmap: `docs/MODULES_ROADMAP.md`
- Decision cases: `docs/DECISION_CASES.md`

## Disclaimer
This system provides decision-support analytics only and does not constitute investment advice.

---

## 中文说明

CryptoFolio 是一个加密资产组合智能系统，用于资产跟踪、风险评估、告警管理与宏观市场观察。

### 主要能力
- 仪表盘总览：KPI、仓位分布、收益曲线与迷你趋势图。
- 多页面路由：资产、交易、风险、告警、策略、压力测试、风险归因、设置。
- 安全导入导出：归一化、校验、净化流程。
- 中英文切换：文案、数字、时间格式保持一致。
- 宏观模块：多资产全球曲线与可解释风险评分。
- 决策模块：目标仓位再平衡、情景压力测试、收益/波动归因。
- 稳定性保障：运行时错误边界、离线降级与缓存回退。

### 线上地址
- 智能入口（推荐）：`https://cdn.jsdelivr.net/gh/QUSETIONS/cryptofolio-pages@main/start.html`
- GitHub Pages：`https://qusetions.github.io/cryptofolio-pages/`
- CDN 镜像：`https://cdn.jsdelivr.net/gh/QUSETIONS/cryptofolio-pages@main/index.html`
- 主站：`https://crypto-portfolio-tracker-tan-nine.vercel.app`
- 分享入口：`https://crypto-portfolio-tracker-tan-nine.vercel.app/open`
- 运行状态：`https://crypto-portfolio-tracker-tan-nine.vercel.app/status`

### 文档入口
- 部署说明：`docs/DEPLOY.md`
- 架构说明：`ARCHITECTURE.md`
- 决策记录：`DECISIONS.md`
- 技术问答：`docs/INTERVIEW_QA.md`
- 模块路线图：`docs/MODULES_ROADMAP.md`
- 决策案例：`docs/DECISION_CASES.md`

> 免责声明：本系统仅提供辅助分析，不构成投资建议。
