# 项目规划升级版：CryptoFolio（个人加密资产分析与风控仪表盘）

## 1. 项目目标（升级后）

将当前项目从“价格追踪小工具”升级为“可扩展的单页资产分析平台”，支持：

- 多资产组合管理（现货、稳定币、现金仓位）
- 持仓级盈亏与交易级复盘
- 风险指标分析（波动、回撤、集中度）
- 告警与策略提醒（目标价、止损、仓位阈值）
- 可持续迭代的工程结构（模块化、可测试、可部署）

一句话定位：`一个可用于面试展示工程能力 + 金融数据思维的 Web3 前端项目`。

---

## 2. 范围定义（MVP / V2 / V3）

### MVP（必须完成）

- 资产增删改查（币种、数量、成本、标签）
- 实时价格与 24h 变动
- 组合总览（总资产、总成本、总盈亏、收益率）
- 资产分布图（按币种、按标签）
- 本地持久化（localStorage）
- 手动刷新 + 自动刷新（默认 60s）

### V2（复杂度提升核心）

- 交易流水模型（买入/卖出/转入/转出/手续费）
- 成本法切换（加权平均法 / FIFO）
- 风险指标：
  - 组合波动率（简化）
  - 最大回撤（基于历史估值快照）
  - 仓位集中度（Top1/Top3 占比）
- 价格告警中心（达到阈值触发提示）
- 历史快照（每天/每小时）与收益曲线

### V3（工程化与产品化）

- 多数据源价格聚合（CoinGecko + 备用源）
- Service Worker 离线只读模式
- 导入导出（CSV / JSON）
- i18n（中英切换）
- GitHub Actions：Lint + Test + Build + Deploy

---

## 3. 架构设计

### 3.1 前端分层

- `ui/`：视图渲染、组件事件
- `domain/`：业务规则（盈亏、风险、告警）
- `data/`：API 访问、缓存、持久化
- `core/`：状态管理、调度器、错误处理
- `shared/`：工具函数、常量、类型定义

### 3.2 状态模型

建议使用“单一状态树 + 派生计算”：

- 原始状态：资产、交易、价格、设置
- 派生状态：估值、盈亏、分布、风险、告警
- 所有 UI 只订阅派生结果，减少重复计算和数据不一致

### 3.3 错误与降级策略

- API 失败：显示最后一次有效价格 + 时间戳
- 频率限制：退避重试（1s/2s/4s）
- 全部价格失败：进入“离线估值模式”（只展示历史快照）

---

## 4. 核心数据模型

```ts
Asset {
  id: string
  coinId: string
  symbol: string
  amount: number
  avgCost: number
  tags: string[]
  createdAt: number
}

Transaction {
  id: string
  assetId: string
  type: 'BUY' | 'SELL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'FEE'
  amount: number
  price: number
  fee: number
  timestamp: number
  note?: string
}

PricePoint {
  coinId: string
  price: number
  change24h: number
  source: string
  updatedAt: number
}

PortfolioSnapshot {
  id: string
  totalValue: number
  totalCost: number
  totalPnl: number
  dailyReturn: number
  timestamp: number
}

AlertRule {
  id: string
  coinId: string
  condition: '>' | '<' | 'drawdown>' | 'position>'
  threshold: number
  enabled: boolean
}
```

---

## 5. 功能拆分（可直接转 issue）

1. 组合总览模块
- KPI 卡片：总资产、总盈亏、收益率、今日变化
- 估值刷新任务调度

2. 资产与交易模块
- 资产 CRUD
- 交易录入与历史列表
- 成本计算引擎（平均法/FIFO）

3. 分析模块
- 资产分布饼图
- 收益曲线折线图
- 回撤区域图

4. 风控与告警模块
- 规则创建、启停、删除
- 命中检测与通知（Toast + 面板）

5. 数据层模块
- 行情聚合器
- 缓存与失效策略
- 导入导出

6. 设置模块
- 刷新间隔、币种显示精度、法币单位、主题、语言

---

## 6. 非功能性要求

- 性能：
  - 首屏渲染 < 2s（本地缓存命中）
  - 常规刷新 < 800ms
- 可靠性：
  - API 异常不导致页面崩溃
  - 所有关键计算有兜底值
- 可维护性：
  - ESLint + Prettier
  - 函数复杂度限制（建议 < 10）
- 安全性：
  - 严格输入校验（数量、价格、精度）
  - 禁止 `innerHTML` 直接拼接用户输入

---

## 7. 测试策略

- 单元测试（核心公式）：
  - 盈亏计算
  - 成本法计算
  - 最大回撤计算
  - 告警触发判断
- 集成测试：
  - 添加资产 -> 拉取价格 -> 更新 KPI
  - API 失败 -> 降级显示
- 端到端测试（Playwright/Cypress 可选）：
  - 用户录入交易并看到图表变化

建议覆盖率目标：`核心 domain >= 85%`。

---

## 8. 里程碑计划（10 天）

### Milestone 1（Day 1-2）：基础稳定版本
- 页面结构、基础样式、资产 CRUD、实时价格

### Milestone 2（Day 3-4）：计算与可视化
- 组合 KPI、盈亏引擎、分布图与收益曲线

### Milestone 3（Day 5-6）：交易流水与成本法
- Transaction 模型、平均法/FIFO 切换

### Milestone 4（Day 7-8）：风控与告警
- 风险指标、告警规则、通知中心

### Milestone 5（Day 9-10）：工程化与交付
- 测试、性能优化、文档、部署、演示脚本

---

## 9. 面试展示亮点（建议重点讲）

- 从“页面功能”升级为“领域模型 + 业务引擎”
- 把金融指标（收益、回撤、集中度）产品化到前端
- 设计了 API 失败降级和缓存策略，保证可用性
- 用测试验证关键算法，体现工程严谨性
- 采用迭代里程碑，展示真实项目推进能力

---

## 10. 风险清单与应对

1. 免费 API 限流
- 应对：请求合并、指数退避、缓存和备用源

2. 指标计算复杂导致 bug
- 应对：先写测试用例再实现公式

3. 前端状态变复杂
- 应对：统一状态树 + 纯函数派生

4. 图表性能下降
- 应对：节流刷新、数据抽样、按需渲染

---

## 11. 交付物清单

- `index.html / style.css / app.js`（或模块化 JS 文件）
- `README.md`（中英双语，含架构图与演示图）
- `PROJECT_PLAN.md`（本文件）
- `docs/`（指标说明、API 设计、测试报告）
- 在线演示地址（GitHub Pages / Vercel）

---

## 12. 下一步建议（执行优先级）

1. 先完成 `MVP + 单元测试骨架`
2. 再上 `交易流水 + 成本法`
3. 最后补 `风险告警 + 工程化 CI`

这样能保证你在任意阶段都可演示，并且每一版都有明确“复杂度增量”。
现在是这样，我现在要面试的是前端，请你先调研一下目前市面上比较好评和知名的前端项目，学习他们的风格。修改我们的前端