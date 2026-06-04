# 金融情报站 · Web (MVP V0.1)

> 自用型跨市场（美股 + A股 + 港股）金融情报站
> 聚焦"前瞻赛道发现 + 个股可投性分析"
> 三色标签系统：🟢 长期价值 / 🟡 中期趋势 / 🔴 短期事件

## 技术栈

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** 严格模式
- **Tailwind CSS v4**
- **静态 JSON 数据**（V0.2 接实时源）

## 本地开发

```bash
# Node >= 18 推荐 Node 20+
npm install
npm run dev
# → http://localhost:3000
```

## 页面结构

| 路径 | 说明 |
|------|------|
| `/` | 首页 / 赛道看板（10 个赛道卡片） |
| `/track/[id]` | 赛道详情页（该赛道下所有股票） |
| `/stock/[id]` | 标的详情页（三色标签 + 投资逻辑 + 反馈） |

## 核心组件

- `components/TagBadge.tsx` — 三色标签
- `components/TrackCard.tsx` — 赛道卡片
- `components/StockCard.tsx` — 股票卡片
- `components/FeedbackBar.tsx` — 标的反馈按钮（localStorage 记录）
- `components/Loading.tsx` — 加载/错误态

## 数据结构

`public/data/seed-tracks.json` — 10 个赛道
`public/data/seed-stocks.json` — 38 只标的

数据通过服务端直接读 `public/data/*.json` 文件加载（无需 fetch，零延迟）。

## Vercel 部署

### 方式一：GitHub 集成（推荐）

1. 把代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 框架预设自动识别为 Next.js
4. 点击 Deploy

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

无需额外环境变量。

## 反馈机制

标的详情页底部 4 个按钮（👍 / 👎 / 已买入 / 已卖出）：
- 点击写入 `localStorage.finance-intel-feedback`
- 控制台 log
- Toast 提示
- 刷新页面后状态保留

V0.2 将改为写入后端数据库。

## 三色标签系统

| 标签 | 含义 | 触发特征 | 持有周期 |
|------|------|---------|---------|
| 🟢 V | 长期价值 | 业绩稳健、护城河深、ROE >15% | 3 年+ |
| 🟡 T | 中期趋势 | 产业拐点、产能周期 | 6-12 月 |
| 🔴 E | 短期事件 | 财报、催化剂、并购 | <3 月 |

一只股票可同时拥有多个标签（如：英伟达 = 🟢 + 🟡）。

## 已知限制

- 静态数据，需手动更新 JSON
- 反馈只存本地，不跨设备
- 无搜索 / 筛选
- 无图表

## 路线图

- **V0.1 (MVP)** ✅ 当前：静态数据 + 10 赛道 + 反馈按钮
- **V0.2**：接实时数据源（东方财富 / Yahoo Finance / SEC）
- **V0.3**：AI 自动生成研报
- **V1.0**：完整自动化 + 智能推荐
