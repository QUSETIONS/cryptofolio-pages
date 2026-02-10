# Interview Script

## EN (5 min)
1. Problem framing: upgraded from tracker to decision-oriented dashboard.
2. Architecture: orchestrator + domain + controllers + renderers + storage.
3. Reliability: import sanitization, escaped render output, async confirms, error boundary.
4. Demo flow: load deterministic snapshot, navigate risk/transactions/alerts, restore state.
5. Quality: syntax checks, unit tests, E2E smoke + scenario tests, CI and Lighthouse reports.

## 中文（5分钟）
1. 问题定义：项目从“记账工具”升级为“决策仪表盘”。
2. 架构拆分：编排层、领域层、控制器、渲染器、存储层职责清晰。
3. 可靠性：导入净化、渲染转义、异步确认弹窗、全局错误边界。
4. 演示策略：加载可复现快照，讲风险/交易/告警，再恢复原状态。
5. 质量证明：语法检查、单测、E2E 场景测试、CI 与性能报告。

## Why i18n + Demo Data
- i18n ensures the same product can be presented in multilingual interviews.
- Demo seed removes live-market uncertainty and guarantees reproducible KPIs.
