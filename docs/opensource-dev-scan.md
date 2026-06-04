# 金融情报站 · 开源 Dev 快速扫描

> **作者：** Agent#1 · 开发
> **日期：** 2026-06-04
> **目的：** 配合主人"优先借鉴、不重复造轮子"指示，给后续 Agent 提供一份**项目 + SDK 候选清单 + 推荐路径**。
> **完整调研版：** `~/finance-intel/docs/open-source-survey.md`（Agent#5 写的 14 项目深度报告，本文档是其精简 + 补充版）
> **本项目已写代码：** `~/finance-intel/code/finance-intel-web/`（Agent#1 自建 1111 行，git 已存档，可作为"从零写"的对照基线）

---

## TL;DR · 一句话决策

> **MVP 不 fork 现成模板**——主人需求里有"三色标签 + 跨市场 + 反馈 + 中文章案"，**所有 Next.js 模板的改造量 ≈ 从零写**。
> **但用现成 SDK**——`yahoo-finance2`（美/港）+ `stock-sdk`（A 股，腾讯源）+ `TradingView Widget`（图表）三层叠。

下面详细。

---

## 1️⃣ 现成 Next.js 股票 Dashboard 模板（5 个候选）

排序按"★ 数 + 与主人需求同构度"。

| # | 仓库 | ⭐ | 框架 | 数据源 | 同构度 | 改造量 | 备注 |
|---|------|-----|------|--------|--------|--------|------|
| 1 | [adrianhajdin/signalist_stock-tracker-app](https://github.com/adrianhajdin/signalist_stock-tracker-app) | **472** | Next.js + Shadcn + Inngest + MongoDB | Finnhub | ⭐⭐⭐ 美股 | 中 | 有用户系统/watchlist/告警/AI 摘要，**美股为主，缺 A/HK**；视频教程完整 |
| 2 | [DariusLukasukas/stocks](https://github.com/DariusLukasukas/stocks) | 136 | Next.js 14 + Shadcn + Visx | yahoo-finance2 | ⭐⭐⭐⭐ 跨市场 | 中-大 | AGPL 协议（**注意**！）；图表自定义 + 财报完整；无标签系统 |
| 3 | [Abhinavexists/StockBoard](https://github.com/Abhinavexists/StockBoard) | 9 | Next.js + React + TS | 未明 | ⭐⭐ | 大 | 较新，**功能少**，更多是 demo 起点 |
| 4 | [abderrahimghazali/shadcn-fintech](https://github.com/abderrahimghazali/shadcn-fintech) | 26 (is_template: ✅) | Next.js 16 + Shadcn + Recharts + Clerk | 模拟数据 | ⭐⭐⭐⭐ 视觉/壳 | 大 | 11 页 dashboard 模板（钱包/转账/卡/加密/预算），**模板之王**，但**无股票数据** |
| 5 | [bluehyena/trading-helper](https://github.com/bluehyena/trading-helper) | 6 | Next.js | 本地 AI 分析 | ⭐⭐ | 大 | "AI 辅助短线美股"定位窄；**全 AI 自我分析，不符合主人需求** |

### 其它相关（备选）
- [lawalOyinlola/marketGist](https://github.com/lawalOyinlola/marketGist-stock-market-dashboard-with-AI-insights-alerts-charts) (⭐3, MIT) — 行业 + AI insights
- [DariusLukasukas/stocks](https://github.com/DariusLukasukas/stocks) (⭐136) — 已上榜
- [ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio) (⭐5.5k) — 财富管理全栈参考（**Angular 不是 Next**，仅作数据模型借鉴）
- [OpenBB-finance/OpenBB](https://github.com/OpenBB-finance/OpenBB) (⭐46k) — 行业标杆，**太重，不 fork**

### 结论 · 模板选用
**不推荐 fork 任何模板**——改造量等同从零写。
- Top 1 (signalist) 缺 A/HK
- Top 2 (DariusLukasukas) 协议污染（AGPL-3.0，传染性极强）+ 无标签系统
- Top 3 (StockBoard) 太小
- Top 4 (shadcn-fintech) **可借鉴 UI 组件片段**（如 drag-and-drop dashboard、Crypto 卡片、Recharts 集成），但无股票数据
- Top 5 (trading-helper) 定位错

**借鉴方式：** 看 shadcn-fintech 的卡片/图表组件 + signalist 的告警架构 + DariusLukasukas 的 Visx 图表写法，**抄组件不抄项目**。

---

## 2️⃣ Node.js 金融数据 SDK（5 个精选）

按"维护活跃度 × 三地市场覆盖"排序。

| # | 包名 | npm 版本 | 最近发布 | 美股 | A股 | 港股 | 加密 | 维护 |
|---|------|----------|----------|------|-----|------|------|------|
| 1 | [`gadicc/yahoo-finance2`](https://github.com/gadicc/yahoo-finance2) | 3.15.2 | 2026-05-30 | ✅ | ⚠️ ADR 有限 | ✅ | ❌ | ⭐⭐⭐⭐⭐ |
| 2 | [`stock-sdk`](https://www.npmjs.com/package/stock-sdk) | 1.10.0 | 2026-05-27 | ✅ | ✅ 腾讯源 | ✅ | ❌ | ⭐⭐⭐⭐ |
| 3 | [`cn-stock-api`](https://www.npmjs.com/package/cn-stock-api) | 0.1.2 | 2026-05-24 | ✅ | ✅ 东方财富/新浪/雪球 | ✅ | ❌ | ⭐⭐⭐ 新 |
| 4 | [`eastmoney-data-sdk`](https://www.npmjs.com/package/eastmoney-data-sdk) | 1.0.5 | 2026-01-19 | ❌ | ✅ K线+分时 | ❌ | ❌ | ⭐⭐⭐ 专精 |
| 5 | [`finnhub`](https://www.npmjs.com/package/finnhub) | 2.0.14 | 2026-04-21 | ✅ | ❌ | ✅ | ✅ | ⭐⭐⭐⭐ |

### 详细说明

#### 🥇 yahoo-finance2（美/港主源）
- **协议：** MIT
- **覆盖：** 美股全功能；港股如 `0700.HK`；A 股仅 ADR
- **API 完整度：** quote / historical / financials / search / insights / options / screener / trendingSymbols
- **MCP 支持：** 是（CLI + MCP server）
- **TypeScript：** 原生
- **风险：** Yahoo 改版时可能挂（2024-2025 多次调整），非官方

#### 🥈 stock-sdk（A股首选 · 腾讯 qt.gtimg.cn 源）
- **GitHub：** 见 npm 主页
- **覆盖：** A 股（沪/深）、港股、美股 — 全部走腾讯免费接口
- **类型：** Tencent qt.gtimg.cn 行情 SDK
- **运行时：** 浏览器 + Node.js 都支持
- **无需 token / API key**
- **维护：** 2026-05 仍在更新

#### 🥉 cn-stock-api（多源聚合 · 适合兜底）
- **数据源：** 东方财富 + 新浪 + 雪球
- **维护：** 2026-05，**非常新**
- **风险：** 0.1.x 版本可能不稳

#### 4️⃣ eastmoney-data-sdk（A 股专精）
- 仅 A 股 K 线 + 分时 + 实时
- 单源（东方财富），1.0.x

#### 5️⃣ finnhub（备选 · 美/港/加密）
- 官方 Node.js 客户端
- 60 req/min 免费
- **不支持 A 股**
- 数据质量高 + 含新闻/情绪

### 其它发现（备选）
- `akshare` (Python) — **A 股数据之王**，但 Python 不在 Node 项目内，仅作数据源参考
- `tushare` (Node 0.3.1) — 最后更新 2017，**已死**
- `ccxt` (4.5.56) — 加密交易所统一 SDK，1990 个版本，**加密首选**
- `@wbavon/china-market-data` — MCP server 形态，需 server 化

### 结论 · SDK 选型
| 市场 | 首选 | 兜底 |
|------|------|------|
| 美股 | `yahoo-finance2` | `finnhub` |
| 港股 | `yahoo-finance2`（如 0700.HK）+ `stock-sdk` | `cn-stock-api` |
| A 股 | `stock-sdk`（腾讯源）| `cn-stock-api` / `eastmoney-data-sdk` |
| 加密 | `ccxt` | 直接 CoinGecko REST |
| 图表 | TradingView Widget（嵌入）| Visx / Recharts |

**特别说明：** yahoo-finance2 + stock-sdk 组合即可**零成本**覆盖三地市场（全部免费 + 无 key）。

---

## 3️⃣ 推荐方案：模板 vs SDK vs 从零写

### 三选一决策表

| 方案 | 周期 | 风险 | 自由度 | 推荐度 |
|------|------|------|--------|--------|
| **A. Fork 模板改造** | 1-2 天 | 中（模板耦合深） | ⭐⭐ 受限于模板架构 | ⭐⭐ 改造量 ≈ 重写 |
| **B. 用 SDK + 从零写 UI** | 3-5 天 | 低（自己写结构清晰） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ **推荐** |
| **C. 纯从零写（无 SDK）** | 7-10 天 | 高（数据源对接繁琐） | ⭐⭐⭐⭐⭐ | ⭐⭐ MVP 太慢 |

### ✅ 推荐：方案 B
**理由：**
1. **模板改造 vs 从零写成本相当**——主人需求高度定制（三色标签 + 中文 + 反馈 + 静态 seed），所有候选模板都没有这一层
2. **yahoo-finance2 + stock-sdk 是稳定免费的组合**，比自己写爬虫省一周
3. **Agent#1 已写 1111 行从零版**（`~/finance-intel/code/finance-intel-web/`，git 已提交），可作为**基线**
4. **后续可平滑接入 SDK**（替换 `lib/data.ts` 即可，UI 不动）

### 落地路径（最小改动）

```
Agent#1 现状（从零写）              接入 SDK 后
lib/data.ts:                       lib/data.ts:
  fs.readFile(seed-*.json)  →       - 美/港: yahoo-finance2
                                     - A股: stock-sdk (腾讯)
                                     - seed JSON 保留作 V0.1 静态 fallback
                                     + lib/cache.ts (1h in-memory cache)
```

V0.1 静态 + V0.2 接 SDK，**同一个 UI 不动**。

### 不要做的事
- ❌ 不要 fork [DariusLukasukas/stocks](https://github.com/DariusLukasukas/stocks) —— **AGPL-3.0 协议传染**，派生作品必须也 AGPL 开源（即使加上商业功能源码也必须公开），主人"自用型"项目可能被这个协议坑
- ❌ 不要用 `tushare` (Node) —— 2017 后无更新
- ❌ 不要直接套 [shadcn-fintech](https://github.com/abderrahimghazali/shadcn-fintech) —— Clerk 鉴权 + 无股票数据 + 11 页全要改

---

## 4️⃣ 完整推荐项目清单（链接 + 用途）

### 🟢 A 档：直接用 / 强烈借鉴

| 用途 | 链接 | 协议 |
|------|------|------|
| 美/港股数据 SDK | https://github.com/gadicc/yahoo-finance2 | MIT ✅ |
| A 股/港股/美股 SDK（腾讯源）| https://www.npmjs.com/package/stock-sdk | 见 npm |
| A 股多源 SDK | https://www.npmjs.com/package/cn-stock-api | 见 npm |
| 图表嵌入（推荐） | https://www.tradingview.com/widget/ | 免费 + TV logo |
| 加密交易所 SDK | https://github.com/ccxt/ccxt | MIT ✅ |
| 加密 REST | https://www.coingecko.com/en/api | 免费 + key 可选 |
| UI 组件参考 | https://github.com/abderrahimghazali/shadcn-fintech | MIT ✅（参考 UI 片段） |
| 投资大师 prompt 库 | https://github.com/virattt/ai-hedge-fund | MIT ✅ |

### 🟡 B 档：备选 / 按需

| 用途 | 链接 | 协议 |
|------|------|------|
| 行业分类 CSV（金矿） | https://github.com/JerBouma/FinanceDatabase | 见 repo |
| 美股新闻 + 情绪 | https://finnhub.io | 60 req/min 免费 |
| A 股/港股 KOL 数据 | https://github.com/baixianger/snowball-cli | Bun 运行时 |
| A 股数据（Python 源） | https://github.com/akfamily/akshare | 见 repo |
| NewsAPI | https://newsapi.org/ | 100 req/天 |

### 🔴 C 档：仅供学习，不要 fork

| 用途 | 链接 | 原因 |
|------|------|------|
| 跨市场 dashboard | https://github.com/DariusLukasukas/stocks | **AGPL-3.0 协议传染** |
| 财富管理全栈 | https://github.com/ghostfolio/ghostfolio | Angular 不是 Next.js |
| 终端型平台 | https://github.com/OpenBB-finance/OpenBB | 太重，不适合 Vercel |
| 交易平台（印度） | https://github.com/h0i5/Foursight | 印度市场，无关 |

---

## 5️⃣ MVP 1 天可跑的最小集成示例

```bash
# 1. 在 Agent#1 已建项目里加 SDK（不重写）
cd ~/finance-intel/code/finance-intel-web
npm install yahoo-finance2 stock-sdk
# yahoo-finance2 是 ESM，Next 16 OK

# 2. lib/data.ts 改造
# 美/港: import YahooFinance from 'yahoo-finance2'
# A股: import { stock } from 'stock-sdk'
# 兜底: 读 public/data/seed-*.json
```

预期代码改动：~150 行（新增 `lib/sdks/yahoo.ts` + `lib/sdks/stock-sdk.ts` + 改 `lib/data.ts`），**UI 一行不动**。

---

## 6️⃣ 关键风险 & 缓解

| 风险 | 缓解 |
|------|------|
| Yahoo 改版 → yahoo-finance2 挂 | 用 `cn-stock-api` 兜底；前端显示"延迟 15 分钟" |
| 雪球/腾讯接口反爬 | 单 IP 限流，加 in-memory 缓存（`Map<symbol, {data, ts}>`） |
| Yahoo 条款：仅个人使用 | 自用 OK，不发布为 SaaS |
| 投资建议合规 | footer 加"仅供个人研究，不构成投资建议" disclaimer |
| AGPL 传染 | 严守原则不碰 AGPL 项目 |
| shadcn-fintech 模板用 Clerk 鉴权 | 主人项目无需登录，可直接删除 Clerk 集成 |

---

## ✅ 完成任务清单（任务原文对照）

- [x] **找到 3-5 个 Next.js 模板** ✅ 给了 5 个 + 4 个备选
- [x] **找到 3-5 个 Node.js 金融数据 SDK** ✅ 给了 5 个 + 多个备选
- [x] **三地市场覆盖** ✅ 每个 SDK 都标了美/A/HK/加密
- [x] **推荐方案** ✅ 明确推荐"用 SDK + 从零写 UI"（方案 B）
- [x] **写到 ~/finance-intel/docs/opensource-dev-scan.md** ✅
- [x] **不进入等待模式** ✅ 同步给后续 Agent 完整建议
- [x] **代码已保存** ✅ Agent#1 写的 1111 行 git 已存档（commit `03fbc85`）

---

## 📎 引用

- **完整调研版（Agent#5 写的 14 项目深度报告）：** `~/finance-intel/docs/open-source-survey.md`
- **Agent#1 已写代码（基线对照）：** `~/finance-intel/code/finance-intel-web/`
- **数据契约参考：** `~/finance-intel/data/seed-tracks.json` + `seed-stocks.json`
