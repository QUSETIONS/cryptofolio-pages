# 🚀 CryptoFolio

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla_JS-f7df1e?logo=javascript&logoColor=black)
![Playwright](https://img.shields.io/badge/Testing-Playwright-2EAD33?logo=playwright&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel&logoColor=white)

CryptoFolio is a **high-performance, zero-framework Web3 portfolio intelligence system**. Designed for professional traders and quantitative analysts, it goes beyond simple asset tracking to offer institutional-grade risk evaluation, macro market monitoring, and extreme runtime resilience.

👉 **[Live Demo (Vercel)](https://crypto-portfolio-tracker-tan-nine.vercel.app/)** | **[GitHub Pages Mirror](https://qusetions.github.io/cryptofolio-pages/)**

---

## ✨ Why CryptoFolio? (The "Hardcore" Engineering)

Built from the ground up without heavy frameworks like React or Vue, this project is a testament to deep engineering fundamentals and Web3-centric resilience:

*   **🏗️ Pure Vanilla JS & Dependency Injection (DI)**
    Business logic and UI are completely decoupled through a custom Inversion of Control (IoC) architecture (`app-orchestrator.js`). The core domain runs flawlessly in Node.js for headless testing, eliminating generic frontend bloating.
*   **🧮 Institutional Financial Engine**
    Hand-crafted mathematical models for **`O(n)` Max Drawdown**, **95% Value at Risk (VaR95)**, and a highly robust **FIFO** cost basis algorithm that handles `1e-12` floating-point precision anomalies (crucial for Web3 meme coins with 18+ decimals).
*   **🛡️ Extreme Resilience (User-Focused)**
    In volatile crypto markets, API Rate Limits (HTTP 429) are common. CryptoFolio implements a robust global `Error Boundary` with a sliding-window `localStorage` failover to prevent quota exhaustion. **Even if the network suddenly disconnects, the dashboard renders seamlessly from cached snapshots without whitespace or crashes.**
*   **🧪 Military-Grade QA (Accountability)**
    Network failure handling isn't just theory; it's proven daily in CI via **Playwright**. End-to-end tests intentionally trigger `context.setOffline(true)` and dispatch `'offline'` events to rigorously assert UI fallback behaviors and error banners.

---

## 📸 Platform Sneak Peek

### Concept & Data Flow Architecture
![Vanilla DI Architecture](docs/architecture.png)

### Desktop Command Center
![Desktop Dashboard](docs/frontend-desktop.png)

### Mobile Adaptation
![Mobile View](docs/frontend-mobile.png)

---

## 🎯 Comprehensive Feature Matrix

| Module | Features & Capabilities |
| :--- | :--- |
| **📊 Dashboard** | High-level KPI metrics, Allocation Donut Charts, Historical Performance curves, and dynamic Asset Sparklines. |
| **🧠 Decision Workspace** | Aggregates Macro indicators (Fed rates, DXY), News sentiment, and Stress-test patterns into actionable risk posture outputs. |
| **📉 Risk Engine** | Computes Volatility, Max Drawdown, VaR95, and Concentration ratios. Evaluates if the current portfolio violates predefined risk tolerances. |
| **⚙️ Strategy Builder** | Target allocation rebalancing, drag-and-drop manual targets, and variance calculations to guide buying/selling decisions. |
| **🚨 Smart Alerts** | Threshold monitoring for Price, Position size, and Drawdown. Fallback evaluation logic to operate even during partial API outages. |
| **🛡️ Anti-Corruption Layer** | Safe data Import/Export. Implements rigorous normalization, deep type validation, and strict XSS sanitization in `storage.js`. |
| **🌍 Deep i18n** | Full bilingual support (`en-US` / `zh-CN`). Automatically formats numbers, decimals, dates, and currencies according to locale. |

---

## 📂 Directory Structure

```text
crypto-portfolio-tracker/
├── api/                  # Serverless functions (Vercel) for proxied data
├── docs/                 # Architectural Decision Records (ADRs) & documentation
├── e2e/                  # Playwright end-to-end offline and happy-path tests
├── js/                   # Pure Vanilla JS modules
│   ├── controllers.js    # UI interaction and event bound dispatchers
│   ├── domain-*.js       # Pure stateless mathematical & business logic
│   ├── error-*.js        # Global sliding-window error boundaries
│   ├── storage.js        # LocalStorage persistence & Anti-Corruption Layer
│   ├── ui-*.js           # DOM manipulation and chart rendering
│   └── util-*.js         # Helpers for i18n, formatting, and debouncing
├── tests/                # Vitest unit test coverage for pure algorithms
├── index.html            # Entry point markup
└── app.js                # Setup and initialization
```

---

## 🛠️ Quick Start & Local Run

Getting the project running locally takes less than a minute. **Zero production dependencies required!**

```bash
# 1. Clone the repository
git clone https://github.com/QUSETIONS/crypto-portfolio-tracker.git
cd crypto-portfolio-tracker

# 2. Install dev dependencies (Playwright, Vitest, Linters)
npm install

# 3. View locally
npx serve .
# Or simply open index.html in any modern browser!
```

---

## 🧪 Testing & CI Pipeline

This project enforces strict quality gates before any deployment:

```bash
# 1. Run unit tests on domain math (Vitest)
npm run test:unit

# 2. Run End-to-End tests simulating offline scenarios (Playwright)
npm run test:e2e:smoke

# 3. Run the complete CI pipeline (Lint, Unit, E2E, Lighthouse)
npm run ci:all
```

> **📚 Documentation References**
> - [Architecture & Design (`ARCHITECTURE.md`)](ARCHITECTURE.md)
> - [Architectural Decision Records (`DECISIONS.md`)](DECISIONS.md)
> - [Deployment Guide (`docs/DEPLOY.md`)](docs/DEPLOY.md)

---
---

## 🇨🇳 中文深度说明 (Chinese Overview)

CryptoFolio 是一个摒弃了 React/Vue 等重型前端框架的**纯 Vanilla JS Web3 资产风险决策系统**。

它不仅仅是一个记账工具，更展现了极致的工程能力、健壮性设计以及对金融业务的深度理解。如果您是面试官或代码审查者，以下是本项目最核心的工程亮点：

### 💎 核心工程亮点

#### 1. 极致解耦：原生依赖注入 (DI)
整个架构实施了严格的**控制反转 (IoC)**。UI 渲染层 (`ui-renderers.js`)、业务逻辑层 (`domain-portfolio.js`) 与持久化层 (`storage.js`) 完全剥离。在 `app-orchestrator.js` 中，通过构造参数将底层能力组装注入给 Controller。
*   **优势**：业务核心代码完全脱离 DOM 环境，可以直接在 Node.js 中进行无头高速并发单元测试。

#### 2. 死磕精度的金融引擎
在原生 JS 环境中，处理高达 18 位精度的 Web3 代币极易出现精度丢失或浮点数截断。
*   本项目在底层利用原生的数组高阶函数，手工推导实现了标准金融圈的 **95% 在险价值 (VaR95)** 和 **波动率方差计算**。
*   在处理 **FIFO (先进先出)** 卖出扣减的复杂队列逻辑时，加入了专门应对 `1e-12` 极小值容差的边界处理机制，彻底杜绝了代币份额对不上账的灾难性 Bug。

#### 3. “防御性编程”与断网级高可用 (User-Focused)
CryptoFolio 将用户体验放在第一位，考虑到 API 频频触发 `429 Rate Limit` 的极端行情：
*   **防爆 Error Boundary**：全局捕获未处理的 Promise 异常，并写入带有 `20` 条记录上限的滑动窗口缓存储列中，防止占满用户本地磁盘。
*   **强制离线验证**：并非口头承诺容灾，而是直接在 E2E 自动化流水线中，通过 Playwright 注入 `context.setOffline(true)` 并派发底层离线事件，严格断言图表能否通过 localStorage 的 fallback 快照安全渲染，保证应用永不白屏！

#### 4. ACL 防腐层与 XSS 净化
*   导入外部导出的 JSON 数据时，数据会经过完整的 Normalize 状态机。除了严格校验字段类型，还会自动调用净化函数清洗备注字段（如 `note`），彻底封死潜在的存储型 XSS 攻击路径。

👉 [点击在线体验系统的丝滑与健壮](https://crypto-portfolio-tracker-tan-nine.vercel.app/)

> 退订声明：本系统界面中生成的策略指标仅用于宏观学习与代码演示，不构成任何形式的真实投资指导或理财建议。
