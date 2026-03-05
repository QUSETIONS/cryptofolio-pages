// Centralized interview prep dataset for realistic QA and coding drills.
// Keep this file plain CommonJS so Node can run it without extra tooling.

const BAGU_QUESTIONS = [
  {
    id: "net-401-403",
    topic: "network",
    difficulty: "L1",
    scenario: "用户反馈“我已经登录了但还是看不到资产页”。",
    question: "401 和 403 的差异是什么？在钱包系统里你会怎么快速定位？",
    keyPoints: [
      "401: 未认证或认证过期，先看 token/session 是否有效。",
      "403: 已认证但无权限，重点看角色、风控策略、接口授权。",
      "定位顺序: 复现 -> 抓包看状态码 -> 查鉴权中间件日志。"
    ],
    modelAnswer:
      "401 是认证问题，通常是 token 失效或未携带；403 是授权问题，说明身份通过了但权限不够。在钱包系统里我会先复现并抓请求，确认是 401 还是 403，再分别排查 token 生命周期和 RBAC/风控策略。",
    followUp: "如果偶发 401，你会先怀疑时钟漂移、刷新 token 竞争还是网关缓存？为什么？"
  },
  {
    id: "net-502-504",
    topic: "network",
    difficulty: "L2",
    scenario: "提币确认页经常报错，用户看到 502/504。",
    question: "502 和 504 的本质区别？测试该如何覆盖？",
    keyPoints: [
      "502: 网关收到上游非法响应或连接异常。",
      "504: 网关等待上游超时。",
      "测试覆盖: 正常/慢响应/超时/重试/降级提示和幂等。"
    ],
    modelAnswer:
      "502 偏向上游返回异常，504 是上游超时未返回。测试上我会设计慢接口和故障注入，验证重试次数、用户提示、以及重复提交是否被幂等保护。",
    followUp: "如果需要在 2 小时内快速止损，你的最小测试集是什么？"
  },
  {
    id: "net-cookie-token",
    topic: "network",
    difficulty: "L1",
    scenario: "移动端钱包登录方案评审。",
    question: "Cookie 和 Token 在移动端场景你更推荐哪个？为什么？",
    keyPoints: [
      "移动端和分布式系统普遍更偏向 token。",
      "Cookie 方案要重点防 CSRF，Token 方案要控存储安全和过期策略。",
      "要回答 tradeoff，不要绝对化。"
    ],
    modelAnswer:
      "移动端我更倾向 token，因为跨域和多服务场景更灵活。但 token 也要注意安全存储、短期有效和刷新机制。Cookie 也能做，但要重点处理 CSRF 和同站策略。",
    followUp: "如果安全团队要求全部 HTTPOnly Cookie，你会怎么调整测试点？"
  },
  {
    id: "net-end2end-path",
    topic: "network",
    difficulty: "L2",
    scenario: "面试官让你解释“输入网址到页面显示发生了什么”。",
    question: "请给出简洁但完整的链路。",
    keyPoints: [
      "DNS 解析 -> TCP/TLS -> HTTP 请求响应 -> 浏览器解析渲染。",
      "可补充缓存、CDN、首包和关键资源阻塞。",
      "回答要分层，不要只背术语。"
    ],
    modelAnswer:
      "核心链路是 DNS 解析域名，建立 TCP/TLS 连接，发起 HTTP 请求拿到 HTML/CSS/JS，再由浏览器解析、构建渲染树并绘制页面。实际中还要考虑 CDN、缓存命中和关键资源加载顺序。",
    followUp: "如果首屏慢，你会优先看哪三个指标？"
  },
  {
    id: "sql-join",
    topic: "sql",
    difficulty: "L1",
    scenario: "你要查‘所有用户及其最近一次提币记录’。",
    question: "LEFT JOIN 和 INNER JOIN 区别是什么？",
    keyPoints: [
      "INNER JOIN 只返回匹配行。",
      "LEFT JOIN 保留左表全量，右表缺失补 NULL。",
      "面试要结合业务说明为什么选 LEFT。"
    ],
    modelAnswer:
      "INNER JOIN 只保留两边都匹配到的数据；LEFT JOIN 会保留左表所有用户，哪怕右侧没有提币记录。这个需求明显要 LEFT JOIN，不然无提币用户会被漏掉。",
    followUp: "如何避免‘最近一次记录’在 JOIN 后重复行？"
  },
  {
    id: "sql-where-having",
    topic: "sql",
    difficulty: "L2",
    scenario: "你要筛选‘近7天交易笔数 > 10 的用户’。",
    question: "WHERE 和 HAVING 的区别？",
    keyPoints: [
      "WHERE 在分组前过滤，HAVING 在分组后过滤聚合结果。",
      "可给出 GROUP BY + COUNT 的例子。",
      "强调执行顺序和性能意识。"
    ],
    modelAnswer:
      "WHERE 用于分组前过滤原始行，HAVING 用于分组后过滤聚合结果。像‘交易笔数 > 10’是聚合条件，应该写在 HAVING。",
    followUp: "若数据量很大，如何降低这条查询成本？"
  },
  {
    id: "sql-index",
    topic: "sql",
    difficulty: "L2",
    scenario: "交易流水页查询慢，接口 P95 超时。",
    question: "索引该怎么排查，不要只说‘加索引’。",
    keyPoints: [
      "先看慢查询和执行计划，确认全表扫原因。",
      "结合过滤条件、排序字段、联合索引顺序。",
      "注意写放大和索引维护成本。"
    ],
    modelAnswer:
      "我会先看慢查询日志和 EXPLAIN，确认是扫描过多还是排序回表。再根据 where/order by 设计联合索引，同时评估写入成本，避免盲目加索引。",
    followUp: "如果查询快了但写入变慢，如何平衡？"
  },
  {
    id: "linux-log",
    topic: "linux",
    difficulty: "L1",
    scenario: "线上报错‘偶发下单失败’，你先上服务器看什么？",
    question: "给出三条你常用命令和用途。",
    keyPoints: [
      "`tail -f` 看实时日志。",
      "`grep` 按关键字过滤错误。",
      "`ps`/`ss` 检查进程和端口。"
    ],
    modelAnswer:
      "我通常先 tail -f 实时看错误，再 grep 聚焦异常关键字，最后用 ps 和端口命令确认服务是否健康。",
    followUp: "你会怎么区分应用错误和依赖服务错误？"
  },
  {
    id: "linux-permission",
    topic: "linux",
    difficulty: "L1",
    scenario: "同学提议直接 chmod 777 快速修复权限问题。",
    question: "你怎么回应？",
    keyPoints: [
      "777 风险高，违反最小权限原则。",
      "先确认 owner/group 和实际运行用户。",
      "给出更安全替代方案。"
    ],
    modelAnswer:
      "我不会把 777 当常规方案。应先确认服务运行用户和目录权限，再最小化授权，比如 750/640 配合正确 owner/group。",
    followUp: "在面试中如何表达‘安全优先但不拖进度’？"
  },
  {
    id: "qa-priority",
    topic: "qa",
    difficulty: "L2",
    scenario: "需求多、时间短，只能测一部分。",
    question: "你如何排测试优先级？",
    keyPoints: [
      "风险驱动: 资金安全 > 关键路径 > 边缘体验。",
      "看变更范围、影响用户量、可回滚性。",
      "先冒烟后回归，给出明确取舍。"
    ],
    modelAnswer:
      "我会先按风险排优先级，资金和不可逆操作最高，其次是核心路径。先做冒烟覆盖关键链路，再补回归，确保有限时间内先防大事故。",
    followUp: "如果 PM 要求全测，你如何沟通取舍？"
  },
  {
    id: "qa-mock-route",
    topic: "qa",
    difficulty: "L1",
    scenario: "后端接口还没完成，但前端页面要联调演示。",
    question: "你如何用自动化继续推进？",
    keyPoints: [
      "Playwright `page.route` 拦截并 mock。",
      "先测页面逻辑和状态流，再切真实接口回归。",
      "可复现的固定数据集很关键。"
    ],
    modelAnswer:
      "我会用 page.route 做请求拦截，返回固定 mock 数据，先保证前端流程可验证。后端就绪后再切换真实接口做回归，保证并行效率。",
    followUp: "mock 很多会不会掩盖真实问题？如何防止？"
  },
  {
    id: "qa-bug-report",
    topic: "qa",
    difficulty: "L1",
    scenario: "你提交了 bug，但开发说‘看不懂，没法复现’。",
    question: "高质量 bug 报告应包含什么？",
    keyPoints: [
      "最小复现步骤、环境信息、期望 vs 实际。",
      "严重级别和业务风险。",
      "必要时附日志、截图、请求样本。"
    ],
    modelAnswer:
      "bug 报告至少要有可复现步骤、环境版本、期望与实际差异，并说明严重程度和业务风险，必要时附日志和请求数据。",
    followUp: "同一个 bug 在不同环境表现不同，你会怎么写？"
  },
  {
    id: "web3-chain-address",
    topic: "web3",
    difficulty: "L2",
    scenario: "用户把 BTC 提到错误链地址导致资产风险。",
    question: "这个场景你的测试点有哪些？",
    keyPoints: [
      "链与地址格式匹配校验。",
      "高风险操作二次确认和强提醒。",
      "错误提示要可理解并可恢复。"
    ],
    modelAnswer:
      "我会重点测链和地址匹配校验、提币前风险提示、以及错误输入时的阻断逻辑，确保用户不会在无提示下发起高风险操作。",
    followUp: "如果业务要求允许高级用户跳过提醒，你怎么设计测试？"
  },
  {
    id: "web3-gas",
    topic: "web3",
    difficulty: "L1",
    scenario: "用户抱怨手续费波动导致交易失败。",
    question: "Gas fee 相关测试你会怎么做？",
    keyPoints: [
      "估算展示准确性和刷新时机。",
      "手续费不足时提示和引导。",
      "网络拥堵下超时/重试/取消路径。"
    ],
    modelAnswer:
      "我会覆盖 gas 估算展示、余额不足提示、拥堵时超时与重试逻辑，并验证失败后用户能清楚知道下一步怎么处理。",
    followUp: "Gas 突然翻倍时，前端应该表现成什么样？"
  },
  {
    id: "java-collections",
    topic: "java",
    difficulty: "L1",
    scenario: "面试官追问你是否能做 Java 基础开发。",
    question: "ArrayList 和 LinkedList 选型差异？",
    keyPoints: [
      "ArrayList 查询快、随机访问好。",
      "LinkedList 适合频繁中间插删但随机访问慢。",
      "实际选型看操作模式，不要只背结论。"
    ],
    modelAnswer:
      "ArrayList 更适合读多写少和随机访问；LinkedList 更适合特定插删场景。真实项目里我会根据访问模式和性能瓶颈来选，不会机械套用。",
    followUp: "如果你不确定，用什么办法快速验证选择？"
  },
  {
    id: "java-exception",
    topic: "java",
    difficulty: "L1",
    scenario: "你在手撕中遇到异常处理追问。",
    question: "checked exception 和 runtime exception 怎么理解？",
    keyPoints: [
      "checked 需要显式处理或声明抛出。",
      "runtime 多是编程逻辑错误，编译期不强制。",
      "回答要落在工程实践上。"
    ],
    modelAnswer:
      "checked exception 编译器要求处理，适合可恢复场景；runtime exception 常是程序逻辑问题。实践里我会对可恢复异常做明确处理，对不可恢复异常做日志和告警。",
    followUp: "测试里你会怎么验证异常分支？"
  },
  {
    id: "scenario-offline-submit",
    topic: "scenario",
    difficulty: "L2",
    scenario: "用户断网后连续点击‘提交交易’。",
    question: "你会如何设计测试防止重复请求和误操作？",
    keyPoints: [
      "按钮禁用/loading 态防抖。",
      "请求幂等键和重试策略。",
      "断网提示与恢复后状态一致性。"
    ],
    modelAnswer:
      "我会测前端防重复点击、后端幂等保护和断网提示。重点看恢复网络后状态是否一致，避免用户误以为没提交而重复操作。",
    followUp: "如果后端暂时不支持幂等，前端如何降低风险？"
  },
  {
    id: "scenario-data-consistency",
    topic: "scenario",
    difficulty: "L2",
    scenario: "资产页总额和明细不一致。",
    question: "你会先查前端展示问题还是后端数据问题？",
    keyPoints: [
      "先做分层定位: 接口返回 -> 前端计算 -> 渲染展示。",
      "抓同一时刻的原始响应和页面数据。",
      "强调可复现和证据链。"
    ],
    modelAnswer:
      "我会先分层定位，先比对接口返回，再看前端计算和渲染。拿同一时刻的原始数据做对账，避免只凭肉眼判断。",
    followUp: "如果只在特定币种出现，你的优先怀疑点是什么？"
  }
];

const CODING_PROBLEMS = {
  "valid-parentheses": {
    title: "Valid Parentheses",
    level: "Easy",
    pattern: "Stack",
    scenario: "交易指令表达式校验：括号不合法直接拒绝提交。",
    signature: "solve(s)",
    statement:
      "给定字符串 s，只包含 ()[]{}，判断括号是否有效配对且顺序正确。返回 true/false。",
    hints: [
      "遇到左括号入栈。",
      "遇到右括号时，检查栈顶是否匹配。",
      "最后栈必须为空。"
    ],
    starter: `/**
 * @param {string} s
 * @returns {boolean}
 */
function solve(s) {
  // TODO: implement stack-based validation
}

module.exports = solve;
`,
    tests: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([)]"], expected: false },
      { args: ["{[]}"], expected: true }
    ]
  },
  "two-sum": {
    title: "Two Sum",
    level: "Easy",
    pattern: "Hash Map",
    scenario: "从交易金额数组中找出两笔和为目标值的记录。",
    signature: "solve(nums, target)",
    statement:
      "给定整数数组 nums 和目标值 target，返回两数之和等于 target 的下标数组 [i, j]。",
    hints: [
      "遍历时记录已见过的值及其下标。",
      "当前值 x 需要找 target - x。",
      "哈希表可以把复杂度降到 O(n)。"
    ],
    starter: `/**
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
function solve(nums, target) {
  // TODO: implement O(n) hash map solution
}

module.exports = solve;
`,
    comparator: "pair",
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] }
    ]
  },
  palindrome: {
    title: "Valid Palindrome",
    level: "Easy",
    pattern: "Two Pointers",
    scenario: "校验用户输入标识是否回文（忽略符号和大小写）。",
    signature: "solve(s)",
    statement:
      "给定字符串 s，忽略非字母数字字符并忽略大小写，判断是否是回文。",
    hints: [
      "双指针从两端向中间收缩。",
      "非字母数字字符直接跳过。",
      "比较时先统一为小写。"
    ],
    starter: `/**
 * @param {string} s
 * @returns {boolean}
 */
function solve(s) {
  // TODO: implement two pointers
}

module.exports = solve;
`,
    tests: [
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["race a car"], expected: false },
      { args: [" "], expected: true }
    ]
  },
  "binary-search": {
    title: "Binary Search",
    level: "Easy",
    pattern: "Binary Search",
    scenario: "在已排序的区块高度列表中快速定位目标高度。",
    signature: "solve(nums, target)",
    statement:
      "给定升序数组 nums 和目标值 target，返回下标；若不存在返回 -1。",
    hints: [
      "维护 left/right 边界。",
      "mid = left + floor((right-left)/2)。",
      "根据比较结果收缩区间。"
    ],
    starter: `/**
 * @param {number[]} nums
 * @param {number} target
 * @returns {number}
 */
function solve(nums, target) {
  // TODO: implement binary search
}

module.exports = solve;
`,
    tests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[1], 1], expected: 0 }
    ]
  }
};

const REALISTIC_PLAN = [
  "Day 1-2: 八股最小闭环（网络+HTTP状态码+认证授权）",
  "Day 3-4: SQL + Linux + Bug report 结构化表达",
  "Day 5-6: Web3 钱包风险场景（链/地址/Gas/幂等）",
  "Day 7-8: 手撕基础题（栈/哈希/双指针/二分）",
  "Day 9-10: 现场口述编码（clarify->approach->code->complexity）",
  "Day 11-12: 模拟面试（八股追问 + 手撕 + 英文30秒）",
  "Day 13-14: 查漏补缺，不开新坑，只修最低分模块"
];

module.exports = {
  BAGU_QUESTIONS,
  CODING_PROBLEMS,
  REALISTIC_PLAN
};

