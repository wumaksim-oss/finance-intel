// Yahoo Finance 数据源封装（懒加载 + 失败降级）
//
// 策略：
//   1. 永远不在模块顶部 require('yahoo-finance2')，避免未装包时 build 失败。
//   2. tryLoadYahoo() 在第一次调用 fetch* 时才尝试动态 import，捕获错误后
//      缓存 null，后续调用直接走降级。
//   3. 所有 fetch* 函数：成功 → 返回真实数据；失败/包不存在 → 返回 null。
//   4. 调用方（index.ts 的 getQuote/getFundamentals）拿到 null 时自己决定
//      是用 seed 数据、mock 数据，还是 throw。
//
// 接口对齐：https://github.com/gadicc/yahoo-finance2
//   - quote() → 单标的报价
//   - quoteSummary() → 基本面（modules: assetProfile / defaultKeyStatistics /
//     financialData / summaryDetail ...）
//   - 批量：quote() 接受 string[] 同时返回多个标的（v3+ 行为）
//
// V0.2 当前未装包，所有 fetch* 永远返回 null。降级逻辑由 index.ts 处理。

/** Yahoo 行情（精简版，与前端 QuoteCard 字段对齐） */
export interface YahooQuote {
  symbol: string;
  /** 当前价 */
  price: number;
  /** 今日涨跌幅 % */
  changePercent: number;
  /** 涨跌额 */
  change: number;
  /** 货币 */
  currency: string;
  /** 交易所时区 */
  marketState?: string;
  /** 抓取时间戳 */
  asOf: number;
}

/** Yahoo 基本面（精简版） */
export interface YahooFundamentals {
  symbol: string;
  /** 公司名 */
  longName?: string;
  /** 行业 */
  industry?: string;
  /** 板块 */
  sector?: string;
  /** 官网 */
  website?: string;
  /** 市值 */
  marketCap?: number;
  /** PE (TTM) */
  peTrailing?: number;
  /** PE (Forward) */
  peForward?: number;
  /** PB */
  priceToBook?: number;
  /** 股息率 % */
  dividendYield?: number;
  /** 52 周高 */
  fiftyTwoWeekHigh?: number;
  /** 52 周低 */
  fiftyTwoWeekLow?: number;
  /** 抓取时间戳 */
  asOf: number;
}

// ---------------------------------------------------------------------------
// 懒加载状态
// ---------------------------------------------------------------------------

/**
 * yahoo-finance2 模块实例（动态导入后缓存），失败则永久为 null。
 * 用 unknown 而非 any，避免外部类型污染。
 */
let _yahoo: unknown = null;
/** 是否已经尝试过加载（避免每次调用都 import 一次） */
let _tried = false;

/** 尝试动态加载 yahoo-finance2。失败时返回 null。 */
export async function tryLoadYahoo(): Promise<unknown> {
  if (_tried) return _yahoo;
  _tried = true;
  try {
    // 动态 import：包未装时不会让 build 失败。
    // @ts-expect-error - 模块未安装时类型不存在，运行时由 try/catch 兜底
    const mod = await import('yahoo-finance2');
    _yahoo = mod.default ?? mod;
    return _yahoo;
  } catch (err) {
    // 包未装、或者 import 失败 → 永久 null
    _yahoo = null;
    if (process.env.NODE_ENV !== 'production') {
      // 仅开发期提示，避免线上噪音
      // eslint-disable-next-line no-console
      console.warn('[data-sources/yahoo] yahoo-finance2 不可用，将走降级:', err);
    }
    return null;
  }
}

/** 调试用：当前是否已成功加载 yahoo-finance2 */
export function isYahooLoaded(): boolean {
  return _yahoo !== null;
}

// ---------------------------------------------------------------------------
// fetch* 函数（全部异步；失败/包不存在 → 返回 null）
// ---------------------------------------------------------------------------

/** 取单只股票报价 */
export async function fetchQuote(symbol: string): Promise<YahooQuote | null> {
  const yahoo = (await tryLoadYahoo()) as
    | undefined
    | {
        quote: (s: string | string[]) => Promise<unknown[]>;
      };
  if (!yahoo) return null;
  try {
    const raw = await yahoo.quote(symbol);
    const r = Array.isArray(raw) ? raw[0] : raw;
    if (!r) return null;
    // yahoo-finance2 v3 返回的字段为 camelCase，含 regularMarketPrice
    const obj = r as Record<string, unknown>;
    const price = num(obj.regularMarketPrice);
    const change = num(obj.regularMarketChange);
    const changePct = num(obj.regularMarketChangePercent);
    if (price == null) return null;
    return {
      symbol: String(obj.symbol ?? symbol),
      price,
      change: change ?? 0,
      changePercent: changePct ?? 0,
      currency: String(obj.currency ?? 'USD'),
      marketState: obj.marketState ? String(obj.marketState) : undefined,
      asOf: Date.now(),
    };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[data-sources/yahoo] fetchQuote(${symbol}) 失败:`, err);
    }
    return null;
  }
}

/** 取多只股票报价（v3+ 支持批量；失败时只把成功的部分返回） */
export async function fetchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  if (symbols.length === 0) return [];
  const yahoo = (await tryLoadYahoo()) as
    | undefined
    | { quote: (s: string | string[]) => Promise<unknown[]> };
  if (!yahoo) return [];
  try {
    const raw = await yahoo.quote(symbols);
    const arr = Array.isArray(raw) ? raw : [raw];
    const out: YahooQuote[] = [];
    for (const item of arr) {
      const obj = item as Record<string, unknown>;
      const price = num(obj.regularMarketPrice);
      if (price == null) continue;
      out.push({
        symbol: String(obj.symbol ?? ''),
        price,
        change: num(obj.regularMarketChange) ?? 0,
        changePercent: num(obj.regularMarketChangePercent) ?? 0,
        currency: String(obj.currency ?? 'USD'),
        marketState: obj.marketState ? String(obj.marketState) : undefined,
        asOf: Date.now(),
      });
    }
    return out;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[data-sources/yahoo] fetchQuotes 失败:`, err);
    }
    return [];
  }
}

/** 取基本面（quoteSummary 包装） */
export async function fetchFundamentals(
  symbol: string
): Promise<YahooFundamentals | null> {
  const yahoo = (await tryLoadYahoo()) as
    | undefined
    | {
        quoteSummary: (
          s: string,
          opts: { modules: string[] }
        ) => Promise<Record<string, unknown>>;
      };
  if (!yahoo) return null;
  try {
    const raw = await yahoo.quoteSummary(symbol, {
      modules: [
        'assetProfile',
        'summaryDetail',
        'defaultKeyStatistics',
        'price',
      ],
    });
    const profile = (raw.assetProfile ?? {}) as Record<string, unknown>;
    const summary = (raw.summaryDetail ?? {}) as Record<string, unknown>;
    const key = (raw.defaultKeyStatistics ?? {}) as Record<string, unknown>;
    const price = (raw.price ?? {}) as Record<string, unknown>;

    const out: YahooFundamentals = {
      symbol,
      asOf: Date.now(),
    };
    if (profile.longName) out.longName = String(profile.longName);
    if (profile.industry) out.industry = String(profile.industry);
    if (profile.sector) out.sector = String(profile.sector);
    if (profile.website) out.website = String(profile.website);

    const mc = num(summary.marketCap) ?? num(price.marketCap);
    if (mc != null) out.marketCap = mc;
    const peT = num(summary.trailingPE) ?? num(key.trailingPE);
    if (peT != null) out.peTrailing = peT;
    const peF = num(summary.forwardPE) ?? num(key.forwardPE);
    if (peF != null) out.peForward = peF;
    const pb = num(summary.priceToBook) ?? num(key.priceToBook);
    if (pb != null) out.priceToBook = pb;
    const dyRaw = num(summary.dividendYield) ?? num(key.dividendYield);
    // Yahoo 的 dividendYield 已是百分比（4.5 = 4.5%）
    if (dyRaw != null) out.dividendYield = dyRaw;
    const hi = num(summary.fiftyTwoWeekHigh);
    if (hi != null) out.fiftyTwoWeekHigh = hi;
    const lo = num(summary.fiftyTwoWeekLow);
    if (lo != null) out.fiftyTwoWeekLow = lo;
    return out;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[data-sources/yahoo] fetchFundamentals(${symbol}) 失败:`, err);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

/** 安全把 unknown 转 number；非有限数 / NaN → null */
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
