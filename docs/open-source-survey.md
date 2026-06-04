# 金融情报站 · 开源项目侦察报告

> **侦察 Agent：** Agent#5 · 开源侦察
> **日期：** 2026-06-04
> **目标：** 为主人老吴的"自用型跨市场金融情报站"搜罗可直接借鉴的开源项目，**优先拿来用，不重复造轮子**。
> **核心需求：**
> 1. 赛道看板（10 个赛道 + 跨市场股票池）
> 2. 标的详情页 + 三色标签（长期/中期/短期）
> 3. 反馈机制（点赞/已买入）
> 4. 部署到 Vercel

---

## TL;DR — 一句话结论

**最推荐的 MVP 路径：**
> Fork `DariusLukasukas/stocks`（Next.js 14 + Yahoo Finance 模板）做前端壳 → 接入 `gadicc/yahoo-finance2`（Node.js 行情） + `baixianger/snowball-cli`（A 股/港股/雪球 KOL）做数据 → 嵌入 `TradingView Widget` 做图表 → 用 Vercel Postgres + NextAuth 做"三色标签"存储 → 1-2 天可跑起来。

下面详细展开。

---

## 1️⃣ 第一类：股票/金融 Dashboard 模板

### 🥇 Top 1: `DariusLukasukas/stocks`（强烈推荐作为 MVP 起点）

- **GitHub：** https://github.com/DariusLukasukas/stocks
- **技术栈：** Next.js 14 (App Router) + React + TailwindCSS + Shadcn UI + Visx 图表 + Radix UI
- **数据源：** `yahoo-finance2`（Node.js）
- **核心功能：**
  - 股票搜索 + 筛选（Screen）
  - 实时报价 + 历史 K 线（多时间粒度）
  - 完整财务报表（利润表/资产负债表/现金流）
  - 公司基本面（PE/PB/股息/52 周高低）
  - 公司资料 + 业务简介
  - Visx 自定义图表（可叠加 MA/布林带/RSI 等技术指标）
  - 个股相关新闻流（按板块筛选）
  - 自选股 Watchlist
  - 用户偏好设置
- **能否直接套用：** ✅ **几乎是主人需求的同构映射**——Next.js 14 + Shadcn + Vercel 部署就是技术栈要求；Yahoo Finance 同时覆盖美股/港股/A 股 ADR；"自选股" 概念可改造成"赛道 + 三色标签"。
- **风险：** A 股深度数据不够（需要叠加 akshare 或 snowball-cli）；`yahoo-finance2` 是非官方包，Yahoo 改版时可能挂。

### 🥈 Top 2: `ghostfolio/ghostfolio`

- **GitHub：** https://github.com/ghostfolio/ghostfolio
- **Star：** ⭐ 5.5k+（成熟项目）
- **技术栈：** Angular + NestJS + Nx + PostgreSQL + Prisma + Redis
- **核心功能：** 财富管理 + 多账户 + ROAI 计算 + 暗模式 + PWA + 多市场
- **能否直接套用：** ⚠️ 架构是"全栈参考"级别，但**前端用 Angular 而非 Next.js**，移植成本高。
- **建议用法：** 借鉴其**数据模型**（交易/账户/资产类别/绩效分析）和**ROAI 计算逻辑**，但**不要直接 fork 前端**。

### 🥉 Top 3: `OpenBB-finance/OpenBB`（行业标杆 · 借鉴数据架构）

- **GitHub：** https://github.com/OpenBB-finance/OpenBB
- **Star：** ⭐ 46k+（行业一哥）
- **技术栈：** Python（OpenBB Platform）+ React（OpenBB Workspace）
- **核心功能：** 40+ 数据源统一接入、股票/期权/加密/宏观/基本面、Python SDK + REST API + 桌面端 + 浏览器端
- **能否直接套用：** ❌ **太重**，不是 Vercel 部署友好的 web 应用。
- **建议用法：** 主人如果将来要做"多数据源切换层"，可参考 OpenBB 的 connector 抽象设计；MVP 阶段先跳过。

### 备选：Firefly III
- **GitHub：** https://github.com/firefly-iii/firefly-iii
- Laravel + 个人理财（支出/预算）— **与本项目不匹配**（理财 ≠ 投资情报）。

---

## 2️⃣ 第二类：金融数据 API/包

### 美股

| 数据源 | 类型 | 免费额度 | API 稳定性 | 中文支持 | 推荐度 |
|---|---|---|---|---|---|
| **`gadicc/yahoo-finance2`** (Node.js) | 包 | 无限制（爬 Yahoo） | ⭐⭐⭐ 中（依赖 Yahoo 接口） | ❌ | 🥇 **MVP 首选** |
| `ranaroussi/yfinance` (Python) | 包 | 无限制 | ⭐⭐⭐ 中 | ❌ | 🥈 数据科学场景 |
| **Alpha Vantage** | REST API | 25 req/天（免费） | ⭐⭐⭐⭐ 高 | ❌ | 🥉 备选 |
| **Finnhub** | REST API | 60 req/min | ⭐⭐⭐⭐ 高 + 公司新闻/情绪 | ❌ | 🥉 备选 |
| Polygon.io（现 Massive.com） | REST + WS | 5 req/min（delayed） | ⭐⭐⭐⭐ 高 | ❌ | ❌ 太贵 |
| TradingView Widget | Embed | 免费（带 TV logo） | ⭐⭐⭐⭐⭐ 极稳 | ✅ | 🥇 **图表 MVP 首选** |

**关键发现：** `gadicc/yahoo-finance2`（不是 `ranaroussi/yfinance`）是 **Node.js / Next.js 生态最活跃的 Yahoo Finance 客户端**，2026-05 还在更新，支持 CLI/MCP/Agent Skill、Bun/Cloudflare/Deno/Node 多运行时，且 TypeScript 原生——**完美匹配主人 Next.js 技术栈**。

**TradingView Widget**（https://www.tradingview.com/widget/）可免费嵌入：Mini Chart、Symbol Info、Advanced Chart、Economic Calendar、Ticker Tape 都有。带 TV 品牌即可免费，去品牌需联系销售。**对自用型 MVP 完全够用**。

### A 股 / 港股

| 数据源 | 类型 | 免费额度 | 中文支持 | 推荐度 |
|---|---|---|---|---|
| **`baixianger/snowball-cli`** (TypeScript/Bun) | CLI/MCP | 雪球登录后无限制 | ✅ 雪球原生 | 🥇 **A 股 MVP 首选** |
| `akfamily/akshare` (Python) | 包 | 无限制（爬各源） | ✅ 原生中文 | 🥈 A 股数据之王 |
| **Tushare Pro** | REST API | 积分制（2000 积分起） | ✅ | 🥉 备选（专业量化） |
| `zer0quant/zer0share` | Python | Tushare Token | ✅ | 🥉 本地化数据管道 |
| `electkismet/eltdx`（通达信协议） | Python/MCP | 个人学习用 | ✅ | ⚠️ 禁止商用 |
| `defeat-beta/defeatbeta-api` | Python | Yahoo 数据更稳版 | ✅ | 🥈 Yahoo 替代 |

**重大发现：`baixianger/snowball-cli`**
- **GitHub：** https://github.com/baixianger/snowball-cli
- **30 个 CLI 命令**，JSON 输出，**AI Agent 友好**：
  - `snowball quote SH600519` — 实时报价
  - `snowball quote --detail` — PE/PB/股息/52周
  - `snowball kline --period week` — K 线
  - `snowball trending day --count 5` — 雪球热门股
  - `snowball kol SH600519` — **KOL 持仓/观点**（主人关注"前瞻性信息"的金矿！）
  - `snowball flow` / `pankou` — 资金流/盘口
  - `snowball forecast` / `income/balance/cashflow` — 财报
  - `snowball industry` — 行业分类
  - `snowball holders --top` — 股东
  - `snowball bonus` — 分红
  - `snowball minute` — 分时图
  - `snowball assort` — 大单拆分
  - `snowball margin` — 融资融券
  - `snowball org` — 机构持仓
  - `snowball export/import` — Token 跨机迁移
- 支持 Bun/Node，可作 MCP 工具服务。
- **致命价值：** 雪球 KOL 数据是中文圈"前瞻性信息"的最佳来源（无新闻源能超越）。

**Tushare Pro**：积分制，专业量化场首选，但**需注册+实名+积分门槛**，MVP 阶段**先不上**。

### 加密货币

| 数据源 | 免费额度 | 推荐度 |
|---|---|---|
| **CoinGecko** | 30 req/min（公开，无 key） | 🥇 **首选** |
| CoinMarketCap | 333 calls/天 | 🥈 备选 |

**CoinGecko**（https://www.coingecko.com/en/api）：无需 key 即可基本查询，REST + WebSocket + Webhook，TypeScript/Python SDK 齐全。

### 一句话总结 API 选型

- **美股/港股：** `yahoo-finance2` (Node) 包；图表用 `TradingView Widget` 嵌入。
- **A 股：** `snowball-cli` (Node) 一站式；本地备份用 `akshare`。
- **加密：** CoinGecko REST。
- **新闻：** NewsAPI + Finnhub（带公司新闻/情绪）。

---

## 3️⃣ 第三类：财经新闻/事件 API

| 数据源 | 免费额度 | 中文 | 抓"前瞻性信息"能力 | 推荐度 |
|---|---|---|---|---|
| **NewsAPI.org** | 100 req/天（开发） | 部分中文 | ⭐⭐ | 🥇 通用 |
| **Finnhub 公司新闻** | 60 req/min | ❌ | ⭐⭐⭐⭐ 强 | 🥇 英文标的 |
| **Alpha Vantage NEWS_SENTIMENT** | 25 req/天 | ❌ | ⭐⭐⭐⭐ 含 AI 情绪分 | 🥈 |
| **雪球 KOL/讨论**（via snowball-cli） | 登录后无限制 | ✅ | ⭐⭐⭐⭐⭐ **最强中文前瞻** | 🥇 **A 股首选** |
| **东财股吧**（无官方 API） | — | ✅ | ⭐⭐⭐⭐ 散户情绪 | ⚠️ 需爬虫 |
| **推特/X API** | $100/月起 | — | ⭐⭐⭐⭐⭐ 名人/CEO 帖 | ❌ 太贵 |
| 财新/路透/Bloomberg | 企业级付费 | ✅ | ⭐⭐⭐⭐⭐ | ❌ 离主人太远 |

**结论：** MVP 阶段**只用 NewsAPI + Finnhub + 雪球 KOL 三个源**，足以覆盖 80% 前瞻性信息需求。
- NewsAPI 抓全球大新闻（关键词搜索）
- Finnhub 抓美股/港股公司新闻
- snowball-cli 的 `kol` 命令抓 A 股/港股雪球大 V 观点

**进阶（V2 再说）：** 加 LLM 总结（"今日三大赛道信号"）+ 情感分析（用 OpenAI/Claude batch API）。

---

## 4️⃣ 第四类：AI Agent 投资研究项目

| 项目 | GitHub | 技术栈 | 风格 | 借鉴点 |
|---|---|---|---|---|
| **`TauricResearch/TradingAgents`** | https://github.com/TauricResearch/TradingAgents | Python/LangGraph | 多 Agent 协作（基本面/情绪/技术/风控/交易员/PM） | **架构范本** |
| **`virattt/ai-hedge-fund`** | https://github.com/virattt/ai-hedge-fund | Python | 单 agent 模拟 13 位投资大师 | "投资大师 prompt 库" |
| **`AI4Finance-Foundation/FinGPT`** | https://github.com/AI4Finance-Foundation/FinGPT | Python/PyTorch | 金融 LLM 微调框架 | 长期方向 |
| **`AI4Finance-Foundation/FinRL-Trading`** | https://github.com/AI4Finance-Foundation/FinRL-Trading | Python/RL | 强化学习量化 | V3+ 方向 |
| **`JerBouma/FinanceDatabase`** | https://github.com/JerBouma/FinanceDatabase | Python | 30 万+ 标的的 **sector/industry 分类库** | 🥇 **赛道分类金矿** |
| **`JerBouma/FinanceToolkit`** | https://github.com/JerBouma/FinanceToolkit | Python | 透明高效财务分析 | 财务比率库 |

### 🥇 强烈推荐：`JerBouma/FinanceDatabase`
- **30 万+ 标的**，按 **country / sector / industry** 分类——**正好对应主人"10 个赛道"需求**。
- 公开 CSV，可直接读入 Vercel Postgres 或本地 JSON。
- 即使只取美股/港股/A 股的部分，赛道映射也是现成的。

### 🥇 强烈推荐：`TauricResearch/TradingAgents`
- **v0.2.5（2026-05）** 还在大版本迭代，活跃度极高。
- **支持 GPT-5.5 / Claude 4.6 / Gemini 3.1 / Qwen / GLM / DeepSeek / MiniMax**——主人有 MiniMax 通道可以直接用。
- 6 类 Agent 协作：Fundamentals / Sentiment / Technicals / Risk Manager / Trader / Portfolio Manager。
- **借鉴点：** V2 可以"赛道研报"自动生成——一个 Agent 拉数据，一个写摘要，一个给标签建议。
- ⚠️ **不要直接套用前端**（CLI 为主），只借鉴 agent 编排思想。

### 🥈 备选：`virattt/ai-hedge-fund`
- 13 位投资大师的 system prompt 集合（巴菲特/芒格/木头姐/达莫达兰/塔勒布等）。
- **可作为"三色标签"自动打标的 prompt 模板**——例如：芒格风格给"长期"红标，塔勒布风格给"短期"绿标。

---

## 5️⃣ MVP 推荐方案（1-2 天可跑起来）

### 架构图

```
┌─────────────────────────────────────────────┐
│  主人浏览器（PC/Mobile）                      │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│  Vercel · Next.js 14 (App Router)            │
│  ┌──────────────────────────────────────┐   │
│  │  Fork: DariusLukasukas/stocks        │   │
│  │  - Shadcn UI + TailwindCSS           │   │
│  │  - Visx 图表（自绘）                   │   │
│  │  - 嵌入 TradingView Widget            │   │
│  └────────────┬──────────────┬──────────┘   │
│               │              │              │
│  API Routes ──┴──────┬───────┴──────────┐   │
└──────────────────────┼──────────────────┼───┘
                       │                  │
        ┌──────────────▼──┐      ┌────────▼──────────┐
        │  yahoo-finance2 │      │  snowball-cli     │
        │  (美/港/A股 ADR) │      │  (A 股/港股)       │
        └─────────────────┘      │  + KOL/资金流      │
                                 └───────────────────┘
                                          │
                                 ┌────────▼──────────┐
                                 │  Vercel Postgres  │
                                 │  - 三色标签        │
                                 │  - 点赞/已买入     │
                                 │  - 用户偏好        │
                                 └───────────────────┘
                                          │
                                 ┌────────▼──────────┐
                                 │  NextAuth.js      │
                                 │  (单用户密码登录)  │
                                 └───────────────────┘
```

### Day 1（6-8 小时）：搭壳

1. **Fork `DariusLukasukas/stocks`** → 部署到 Vercel（30 分钟）
2. 改 `package.json`：
   - 加 `yahoo-finance2`、`snowball-cli`、`@vercel/postgres`、`next-auth`
3. 改 `app/page.tsx`：把默认首页改成"赛道看板"
4. 改 `app/api/quote/[symbol]/route.ts`：路由分流
   - 美股/港股 → yahoo-finance2
   - A 股（SH/SZ 开头）→ `exec('snowball quote ...')` 或包成 Bun 脚本
5. 接入 **TradingView Widget**（iframe 即可，无需安装）

### Day 2（4-6 小时）：核心差异化功能

1. **三色标签系统：**
   - Vercel Postgres 建表 `tags(ticker, horizon, label, note, created_at)`
   - horizon ∈ {long, mid, short}
   - 标签 UI 用 Shadcn 的 `Badge` + `Dialog`
2. **反馈机制：**
   - 表 `feedback(ticker, kind, created_at)` — kind ∈ {like, bought}
3. **赛道分类：**
   - 从 `JerBouma/FinanceDatabase` 导出 CSV → 导入 Postgres
   - 在 `app/sectors/page.tsx` 按 sector 分组
4. **KOL 信号卡片**（A 股专属）：
   - `app/api/xueqiu/kol/[symbol]/route.ts` 调 snowball-cli
   - 渲染雪球 KOL 最新发言

### V2 路线（第二周再说）

- 接入 **TradingAgents** 的 agent 编排做"自动赛道研报"
- 加 NewsAPI + Finnhub 新闻流
- 加 LLM 总结（"今日 AI 赛道三大信号"）
- 加三色标签**自动打标**（用 virattt/ai-hedge-fund 风格 prompt）

---

## 6️⃣ 技术栈建议（最终版）

| 层 | 选型 | 理由 |
|---|---|---|
| **前端框架** | Next.js 14 (App Router) | 主人原计划；Vercel 部署零配置；Server Components 适合拉金融数据 |
| **UI 库** | Shadcn UI + TailwindCSS | `DariusLukasukas/stocks` 同款；可复制粘贴组件 |
| **图表** | TradingView Widget（嵌入）+ Visx（自绘） | TV 免费、自带数据；Visx 已有现成 |
| **数据 - 美股/港股** | `gadicc/yahoo-finance2` (Node) | 同技术栈；活跃维护；TypeScript 原生 |
| **数据 - A 股** | `baixianger/snowball-cli` (Bun/Node) | 30 命令一条龙；含 KOL/资金流/财报/行业 |
| **数据 - 加密** | CoinGecko REST | 免费、无需 key、覆盖全 |
| **新闻** | NewsAPI + Finnhub | 互补：全球新闻 + 公司情绪 |
| **数据库** | Vercel Postgres | 与 Vercel 原生集成；免费层够用 |
| **认证** | NextAuth.js (Credentials) | 单用户密码；MVP 够用 |
| **部署** | Vercel | 主人原计划；Hobby 层免费 |
| **缓存** | Vercel KV (Redis) | Yahoo 接口限流必备 |

**全部月成本估算：** $0（Vercel Hobby + Vercel Postgres Free + 所有 API 免费层）— **完美匹配主人"低预算"要求**。

---

## 7️⃣ 风险点（哪些项目不能直接用，要二次开发）

| 项目 | 风险 | 应对 |
|---|---|---|
| `DariusLukasukas/stocks` | 默认是**个人**项目，无鉴权、无多用户、无标签系统 | 加 NextAuth + Postgres 表 |
| `gadicc/yahoo-finance2` | Yahoo 改版时可能挂（2024-2025 已多次调整） | 用 `defeat-beta/defeatbeta-api` 作 fallback；前端加 loading/error 兜底 |
| `baixianger/snowball-cli` | **依赖雪球登录态**；需 QR 码或 Cookie 注入 | 一次性登录后导出 token（项目自带 `snowball export/import`） |
| `yahoo-finance2` 商用 | Yahoo 条款：**仅供个人使用** | 自用型 OK，**不要发布为 SaaS** |
| `TradingView Widget` | 免费版带 TV logo | 自用完全 OK；要无 logo 需付费 |
| `akshare` | 部分接口反爬升级后会失效 | 作 V2 备份源，不放主链 |
| `FinRL / FinGPT` | 训练成本高（GPU） | 暂不部署，**只读论文和 prompt** |
| 雪球数据**商用风险** | 雪球用户协议有爬虫限制 | **自用 OK**，对外发布前需咨询律师 |
| 投资建议合规 | 任何"买入/卖出"提示都需 disclaimer | 加 footer "本系统仅供个人研究，不构成投资建议" |
| 数据延迟 | Yahoo/snowball 实时性不如券商 | 详情页明确显示"延迟 15 分钟"；如要实时需另接券商 API |

---

## 8️⃣ 项目清单（供后续 Agent 引用）

### 强烈推荐（4 个）
1. **【Dashboard 壳】** https://github.com/DariusLukasukas/stocks
2. **【美股/港股数据】** https://github.com/gadicc/yahoo-finance2
3. **【A 股/港股数据 + KOL】** https://github.com/baixianger/snowball-cli
4. **【赛道分类库】** https://github.com/JerBouma/FinanceDatabase

### 备选/借鉴（4 个）
5. **【架构参考 - 财富管理】** https://github.com/ghostfolio/ghostfolio
6. **【架构参考 - 终端型】** https://github.com/OpenBB-finance/OpenBB
7. **【AI 投资大师 prompt 库】** https://github.com/virattt/ai-hedge-fund
8. **【多 Agent 协作框架】** https://github.com/TauricResearch/TradingAgents

### 数据/工具（3 个）
9. **【A 股数据之王】** https://github.com/akfamily/akshare
10. **【本地化 A 股管道】** https://github.com/zer0quant/zer0share
11. **【通达信 MCP】** https://github.com/electkismet/eltdx

### 嵌入组件
12. **【图表 - 免费嵌入】** https://www.tradingview.com/widget/
13. **【加密数据】** https://www.coingecko.com/en/api
14. **【新闻】** https://newsapi.org/

---

## 9️⃣ 给后续 Agent 的建议

- **Agent #6（架构师）**：优先把 `DariusLukasukas/stocks` 跑通，作为基线；数据层抽象成 `DataProvider` interface（Yahoo/snowball 可切换）
- **Agent #7（后端）**：重点关注 `snowball-cli` 在 Vercel 部署的方案——Vercel Serverless 跑不了 Bun？需要用 Node 兼容层或预渲染快照
- **Agent #8（前端）**：直接复制 Shadcn 组件，10 个赛道页面用 `app/sectors/[slug]/page.tsx` 动态路由
- **Agent #9（数据）**：`FinanceDatabase` CSV → Vercel Postgres 的脚本；先建好 sector/industry 映射表

---

## ✅ 完成任务清单

- [x] 4 类项目各搜了 Top 3+ 推荐
- [x] 每个项目给了：GitHub 链接、技术栈、能否直接套用、风险
- [x] 给了 MVP 推荐方案（1-2 天）
- [x] 给了完整技术栈建议（全 $0 月成本）
- [x] 给了风险点清单
- [x] 文档写到 `~/finance-intel/docs/open-source-survey.md`

**总侦察项目数：** 14 个核心 + 多个备选
**最推荐的 4 个：** DariusLukasukas/stocks + yahoo-finance2 + snowball-cli + FinanceDatabase
**MVP 一天半可上线**
