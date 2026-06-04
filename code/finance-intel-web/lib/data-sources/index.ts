// 数据源统一对外接口（barrel）
//
// 设计原则：
//   1. 前端只 import from '@/lib/data-sources'，**不要**直接 import 子模块。
//   2. 三个核心函数：getQuote / getFundamentals / getForwardSignals。
//   3. 降级策略：yahoo-finance2 / snowball-cli 任一不可用时，自动用 seed /
//      mock 数据，保证页面永远有内容显示。
//   4. **不抛异常**：所有失败 → 静默降级到 seed/mock。
//
// 未来 V0.3+ 计划：
//   - 加 Redis 缓存层（5 分钟 TTL）
//   - 引入"数据源健康检查"端点
//   - 支持运行时切换数据源（Vercel env flag）

// ---------------------------------------------------------------------------
// re-export 类型 / 工具 / 来源
// ---------------------------------------------------------------------------

export type {
  ForwardSignal,
  ForwardView,
  ForwardSource,
  StockCode,
  SignalStats,
} from './forward-signals';
export {
  VIEW_LABEL,
  VIEW_COLOR,
  VIEW_EMOJI,
  SOURCE_LABEL,
  SOURCE_COLOR,
  filterByView,
  filterBySource,
  filterByCode,
  dedupeSignals,
  sortByPublishedDesc,
  sortByConfidenceDesc,
  groupByCode,
  groupByView,
  groupBySource,
  pipeline,
  statsOf,
} from './forward-signals';

export type { YahooQuote, YahooFundamentals } from './yahoo';
export { isYahooLoaded } from './yahoo';

export type { SnowballQuote, SnowballKolPost } from './snowball';
export { normalizeSnowballSymbol, kolPostToSignal } from './snowball';

export { getMockForwardSignals, debugMockStats } from './mock-forward-signals';

// ---------------------------------------------------------------------------
// 内部导入
// ---------------------------------------------------------------------------

import { fetchQuote as yahooFetchQuote, fetchQuotes as yahooFetchQuotes, fetchFundamentals as yahooFetchFundamentals } from './yahoo';
import { fetchQuote as snowballFetchQuote, fetchKolPosts as snowballFetchKolPosts, kolPostToSignal as snowballKolPostToSignal } from './snowball';
import { getMockForwardSignals } from './mock-forward-signals';
import { fetchStocks } from '../data';
import type { Stock, Market } from '../types';
import type { ForwardSignal, ForwardView, ForwardSource } from './forward-signals';

// ---------------------------------------------------------------------------
// seed 股票池（懒缓存，供降级 / meta 查找用）
// ---------------------------------------------------------------------------

let _stockCache: Map<string, Stock> | null = null;

async function loadStocksCache(): Promise<Map<string, Stock>> {
  if (_stockCache) return _stockCache;
  const all = await fetchStocks();
  _stockCache = new Map();
  for (const s of all) {
    _stockCache.set(s.code, s);
    _stockCache.set(s.code.toUpperCase(), s);
  }
  return _stockCache;
}

async function getStockByCode(code: string): Promise<Stock | undefined> {
  const cache = await loadStocksCache();
  return cache.get(code) ?? cache.get(code.toUpperCase());
}

/** 兜底：从 code 猜市场（meta 缺失时用） */
function guessMarket(code: string): Market {
  const c = code.toUpperCase();
  if (/^(SH|SZ)\d{6}$/.test(c) || /^\d{6}$/.test(c)) return 'CN';
  if (/^HK\d{5}$/.test(c) || /^\d{5}$/.test(c)) return 'HK';
  return 'US';
}

function currencyFor(market: Market): string {
  switch (market) {
    case 'US':
      return 'USD';
    case 'HK':
      return 'HKD';
    default:
      return 'CNY';
  }
}

// ---------------------------------------------------------------------------
// Quote 统一接口
// ---------------------------------------------------------------------------

/** 统一 Quote 类型（前端 QuoteCard 用） */
export interface UnifiedQuote {
  symbol: string;
  name: string;
  market: Market;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  /** 数据来源：yahoo / snowball / seed（数据新鲜度从高到低） */
  source: 'yahoo' | 'snowball' | 'seed';
  asOf: number;
}

/**
 * 取实时报价。降级顺序：yahoo → snowball → seed.json
 * 永不抛异常。
 */
export async function getQuote(code: string): Promise<UnifiedQuote | null> {
  const meta = await getStockByCode(code);
  const market: Market = meta?.market ?? guessMarket(code);

  // 1) 美股 / 港股 → yahoo
  if (market === 'US' || market === 'HK') {
    const yq = await yahooFetchQuote(code);
    if (yq) {
      return {
        symbol: yq.symbol,
        name: meta?.name ?? code,
        market,
        price: yq.price,
        change: yq.change,
        changePercent: yq.changePercent,
        currency: yq.currency,
        source: 'yahoo',
        asOf: yq.asOf,
      };
    }
  }

  // 2) A 股 / 港股 → snowball
  if (market === 'CN' || market === 'HK') {
    const sq = await snowballFetchQuote(code);
    if (sq) {
      return {
        symbol: sq.symbol,
        name: sq.name ?? meta?.name ?? code,
        market,
        price: sq.price,
        change: sq.change,
        changePercent: sq.changePercent,
        currency: sq.currency ?? currencyFor(market),
        source: 'snowball',
        asOf: sq.asOf,
      };
    }
  }

  // 3) 降级到 seed
  if (meta) {
    return {
      symbol: code,
      name: meta.name,
      market: meta.market,
      price: meta.price,
      change: 0, // seed 数据无 change 字段，留 0
      changePercent: meta.changePercent,
      currency: currencyFor(meta.market),
      source: 'seed',
      asOf: 0,
    };
  }
  return null;
}

/** 批量取报价（用于赛道页 / 自选股列表） */
export async function getQuotes(codes: string[]): Promise<UnifiedQuote[]> {
  if (codes.length === 0) return [];
  // 预加载 stock cache 一次
  const cache = await loadStocksCache();
  // 美股走 yahoo 批量
  const usCodes = codes.filter((c) => {
    const m = cache.get(c)?.market ?? cache.get(c.toUpperCase())?.market ?? guessMarket(c);
    return m === 'US';
  });
  const yahooResults = usCodes.length > 0 ? await yahooFetchQuotes(usCodes) : [];
  const yahooMap = new Map(yahooResults.map((q) => [q.symbol, q]));

  const out: UnifiedQuote[] = [];
  for (const code of codes) {
    const meta = cache.get(code) ?? cache.get(code.toUpperCase());
    const market: Market = meta?.market ?? guessMarket(code);
    if (market === 'US' && yahooMap.has(code)) {
      const q = yahooMap.get(code)!;
      out.push({
        symbol: code,
        name: meta?.name ?? code,
        market,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        currency: q.currency,
        source: 'yahoo',
        asOf: q.asOf,
      });
    } else {
      const single = await getQuote(code);
      if (single) out.push(single);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fundamentals 统一接口
// ---------------------------------------------------------------------------

export interface UnifiedFundamentals {
  symbol: string;
  name: string;
  market: Market;
  longName?: string;
  industry?: string;
  sector?: string;
  marketCap?: number;
  peTrailing?: number;
  peForward?: number;
  priceToBook?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  source: 'yahoo' | 'seed';
  asOf: number;
}

/** 取基本面。降级：yahoo → seed（无字段时用 undefined） */
export async function getFundamentals(code: string): Promise<UnifiedFundamentals | null> {
  const meta = await getStockByCode(code);
  if (!meta) return null;
  const market = meta.market;

  // 美股/港股：yahoo 优先
  if (market === 'US' || market === 'HK') {
    const yf = await yahooFetchFundamentals(code);
    if (yf) {
      return {
        symbol: code,
        name: meta.name,
        market,
        longName: yf.longName,
        industry: yf.industry ?? meta.industry,
        sector: yf.sector,
        marketCap: yf.marketCap,
        peTrailing: yf.peTrailing,
        peForward: yf.peForward,
        priceToBook: yf.priceToBook,
        dividendYield: yf.dividendYield,
        fiftyTwoWeekHigh: yf.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: yf.fiftyTwoWeekLow,
        source: 'yahoo',
        asOf: yf.asOf,
      };
    }
  }

  // 降级：seed 数据
  return {
    symbol: code,
    name: meta.name,
    market,
    industry: meta.industry,
    source: 'seed',
    asOf: 0,
  };
}

// ---------------------------------------------------------------------------
// ForwardSignals 统一接口
// ---------------------------------------------------------------------------

export interface GetForwardSignalsOptions {
  code?: string | string[];
  view?: ForwardView;
  source?: ForwardSource | ForwardSource[];
  /** 是否尝试用 snowball 拉真 KOL 信号（默认 false；包未装不会抛错） */
  withLiveKol?: boolean;
  /** 限制返回条数（按 publishedAt 倒序截断） */
  limit?: number;
}

/**
 * 取前瞻信号。降级顺序：
 *   1) snowball-cli 拉 KOL（如果 withLiveKol=true 且 CLI 可用）
 *   2) mock-forward-signals（38 只股票 × 1-2 条，全量覆盖）
 *
 * 注意：当前 yahoo / snowball 包均未装，此函数默认只返回 mock。
 * 真正接包后把 withLiveKol 设为 true 即可（API 形态不变）。
 */
export async function getForwardSignals(
  opts: GetForwardSignalsOptions = {}
): Promise<ForwardSignal[]> {
  let signals: ForwardSignal[] = [];

  if (opts.withLiveKol && opts.code) {
    // 尝试给指定 code 拉一次 KOL（限制 2 条/股）
    const codes = Array.isArray(opts.code) ? opts.code : [opts.code];
    for (const code of codes) {
      const posts = await snowballFetchKolPosts(code, 2);
      for (const post of posts) {
        signals.push(snowballKolPostToSignal(post, code));
      }
    }
  }

  if (signals.length === 0) {
    // 降级到 mock
    signals = getMockForwardSignals();
  }

  // 应用过滤
  if (opts.code) {
    const set = new Set(Array.isArray(opts.code) ? opts.code : [opts.code]);
    signals = signals.filter((s) => set.has(s.code));
  }
  if (opts.view) {
    signals = signals.filter((s) => s.view === opts.view);
  }
  if (opts.source) {
    const set = new Set(Array.isArray(opts.source) ? opts.source : [opts.source]);
    signals = signals.filter((s) => set.has(s.source));
  }

  // 按发布时间倒序
  signals = [...signals].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  if (opts.limit && opts.limit > 0) {
    signals = signals.slice(0, opts.limit);
  }
  return signals;
}

// ---------------------------------------------------------------------------
// 数据源健康检查
// ---------------------------------------------------------------------------

export interface DataSourceHealth {
  yahoo: 'available' | 'unavailable';
  snowball: 'available' | 'unavailable';
  mock: 'available';
  seed: 'available' | 'unavailable';
}

/** 一次性检查所有数据源可用性（用于 /api/health 端点） */
export async function checkDataSourceHealth(): Promise<DataSourceHealth> {
  let seed: 'available' | 'unavailable' = 'unavailable';
  try {
    const stocks = await fetchStocks();
    seed = stocks.length > 0 ? 'available' : 'unavailable';
  } catch {
    seed = 'unavailable';
  }
  return {
    yahoo: 'unavailable', // 懒加载，调用方可用 tryLoadYahoo() 自行检测
    snowball: 'unavailable', // 同上，调用方可 spawn 一次试
    mock: 'available',
    seed,
  };
}
