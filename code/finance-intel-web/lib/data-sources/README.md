# 数据源模块（V0.2）

金融情报站的统一数据接入层。**所有页面只 import 自 `@/lib/data-sources`，不要直接 import 子模块**。

## 文件清单

| 文件 | 职责 |
|---|---|
| `forward-signals.ts` | `ForwardSignal` 类型 + view/source 标签 + filter/sort/group 工具 |
| `yahoo.ts` | `yahoo-finance2` 懒加载封装，`fetchQuote` / `fetchFundamentals` / `fetchQuotes` |
| `snowball.ts` | `snowball-cli` spawn 封装，`fetchQuote` / `fetchKolPosts` + `kolPostToSignal` |
| `stock-meta.ts` | 38 只种子股的精简 meta 索引（code → name/market/industry） |
| `mock-forward-signals.ts` | 38 只股票 × 1-2 条 mock 信号生成器（确定性，无外部依赖） |
| `index.ts` | 统一对外接口：`getQuote` / `getFundamentals` / `getForwardSignals` |

## 快速上手

```ts
// ✅ 推荐
import {
  getQuote,
  getFundamentals,
  getForwardSignals,
  VIEW_LABEL,
  SOURCE_LABEL,
  statsOf,
} from '@/lib/data-sources';

// ❌ 不要这样做（破坏封装、无法统一降级）
import { fetchQuote } from '@/lib/data-sources/yahoo';
```

## 三个核心 API

### 1. `getQuote(code)`

取实时报价。**降级顺序**：yahoo → snowball → seed

```ts
const q = await getQuote('NVDA');
// q?.source: 'yahoo' | 'snowball' | 'seed'
// q?.price: number
```

### 2. `getFundamentals(code)`

取基本面（PE / PB / 股息率 / 52 周高低 / 行业 / 板块）。**降级顺序**：yahoo → seed

```ts
const f = await getFundamentals('NVDA');
// f?.peTrailing, f?.marketCap, ...
```

### 3. `getForwardSignals(opts)`

取前瞻信号。**降级顺序**：snowball KOL（可选） → mock

```ts
// 取 NVDA 的所有信号
const sigs = await getForwardSignals({ code: 'NVDA' });

// 取赛道所有 bullish × 雪球 KOL 信号
const sigs = await getForwardSignals({
  view: 'bullish',
  source: 'xueqiu',
  limit: 10,
});

// 开启真 KOL（需要 snowball-cli 已装）
const sigs = await getForwardSignals({ code: 'NVDA', withLiveKol: true });
```

## 数据规模（V0.2 mock）

- 38 只股票（17 美 / 14 A / 7 港）
- ~64 条 mock 信号
- view 分布：bullish 23 / bearish 19 / neutral 22
- source 分布：xueqiu 38 / analyst 16 / news 10

## 降级策略

```
                ┌─────────────────┐
                │  yahoo-finance2  │ ← 动态 import，包未装不抛错
                │   (美股/港股)     │
                └────────┬────────┘
                         ↓ 失败
                ┌─────────────────┐
                │  snowball-cli    │ ← spawn 子进程，CLI 未装不抛错
                │ (A 股/港股 +KOL) │
                └────────┬────────┘
                         ↓ 失败
                ┌─────────────────┐
                │  seed-stocks.json│ ← 静态数据，永远可用
                │   + mock signals │
                └─────────────────┘
```

**所有 fetch 函数永不抛异常**。包未装 → null → 调用方降级到 seed。

## 类型 / 工具快速参考

```ts
// 视图
VIEW_LABEL.bullish   // '看多'
VIEW_LABEL.bearish   // '看空'
VIEW_LABEL.neutral   // '中性'
VIEW_EMOJI.bullish   // '🟢'

// 来源
SOURCE_LABEL.xueqiu   // '雪球 KOL'
SOURCE_LABEL.analyst  // '券商研报'

// 工具
pipeline(signals, { view: 'bullish', source: 'xueqiu', sort: 'published' })
statsOf(signals)      // { total, byView, bySource, netSentiment }
groupByCode(signals)  // Map<code, ForwardSignal[]>
```

## 安装真数据源（可选，V0.2 默认不装）

```bash
# 美股/港股：yahoo-finance2
npm install yahoo-finance2

# A 股/港股 + KOL：snowball-cli（全局）
npm install -g snowball-cli
# 或 Bun
bun add -g snowball-cli

# snowball 登录
snowball login  # 扫码

# 验证
npx tsx -e "import { getForwardSignals } from './lib/data-sources'; \
  getForwardSignals({ code: 'NVDA', withLiveKol: true }).then(console.log)"
```

## 未来扩展（V0.3+）

- [ ] Redis 缓存层（5 分钟 TTL）
- [ ] `/api/health` 端点暴露 `checkDataSourceHealth()`
- [ ] 运行时切换数据源（Vercel env flag）
- [ ] Finnhub / NewsAPI 接入（reference: docs/open-source-survey.md 第三节）
- [ ] LLM 总结层（"今日三大赛道信号"）
