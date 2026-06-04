// 前瞻信号（Forward Signal）类型 + 视图 / 来源 标签
// V0.2 数据源模块核心抽象：把 Yahoo Finance / Snowball KOL / 分析师研报
// / 财经新闻 4 类源头统一抽象成 "ForwardSignal[]"，供前端 "前瞻信息" 模块消费。
//
// 设计目标：
//   1. 单一类型、单一出口（index.ts 统一导出），前端只用 ForwardSignal[]。
//   2. 视图（view）三态：bullish / bearish / neutral；与三色标签解耦，仅表"前瞻方向"。
//   3. 来源（source）四类：xueqiu / analyst / news / internal；用于横向对比与去重。
//   4. 工具函数纯函数，便于 SSR / Server Component 直接调用。

/** 视图：信号的前瞻方向 */
export type ForwardView = 'bullish' | 'bearish' | 'neutral';

/** 来源：信号出处 */
export type ForwardSource = 'xueqiu' | 'analyst' | 'news' | 'internal';

/** 标的代码（A 股 SH/SZ 前缀、港股 HK 前缀、美股裸 code；与 seed-stocks.json 一致） */
export type StockCode = string;

/**
 * 前瞻信号。
 * view/source/title 必填；summary/url/author/publishedAt/confidence 可选。
 * id 用于 React 列表 key 与去重（同股同 source 同 view 同 title 视为重复）。
 */
export interface ForwardSignal {
  /** 唯一 ID（推荐 `${code}:${source}:${view}:${hash(title)}`） */
  id: string;
  /** 关联股票代码（NVDA / SH600519 / HK00700 等） */
  code: StockCode;
  /** 视图：bullish / bearish / neutral */
  view: ForwardView;
  /** 来源：xueqiu / analyst / news / internal */
  source: ForwardSource;
  /** 标题（必填，便于卡片显示） */
  title: string;
  /** 摘要（可选，1-2 句） */
  summary?: string;
  /** 原始链接（可选） */
  url?: string;
  /** 作者 / 机构（雪球 KOL / 券商 / 媒体） */
  author?: string;
  /** 发布时间（ISO 字符串） */
  publishedAt?: string;
  /** 置信度 0-1（仅 internal source 使用，外部信号默认 0.6） */
  confidence?: number;
}

/** view 中文标签（前端展示用） */
export const VIEW_LABEL: Record<ForwardView, string> = {
  bullish: '看多',
  bearish: '看空',
  neutral: '中性',
};

/** view 颜色（Tailwind class，前端直接用） */
export const VIEW_COLOR: Record<ForwardView, string> = {
  bullish: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  bearish: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

/** view emoji（与三色标签风格统一） */
export const VIEW_EMOJI: Record<ForwardView, '🟢' | '🔴' | '🟡'> = {
  bullish: '🟢',
  bearish: '🔴',
  neutral: '🟡',
};

/** source 中文标签 */
export const SOURCE_LABEL: Record<ForwardSource, string> = {
  xueqiu: '雪球 KOL',
  analyst: '券商研报',
  news: '财经新闻',
  internal: '内部研究',
};

/** source 颜色（Tailwind class） */
export const SOURCE_COLOR: Record<ForwardSource, string> = {
  xueqiu: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  analyst: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  news: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  internal: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

// ---------------------------------------------------------------------------
// 过滤 / 排序 / 分组 工具（纯函数）
// ---------------------------------------------------------------------------

/** 按 view 过滤（view 为 undefined 时不过滤） */
export function filterByView(
  signals: ForwardSignal[],
  view: ForwardView | undefined
): ForwardSignal[] {
  if (!view) return signals;
  return signals.filter((s) => s.view === view);
}

/** 按 source 过滤（source 为 undefined / 空数组时不过滤） */
export function filterBySource(
  signals: ForwardSignal[],
  source: ForwardSource | ForwardSource[] | undefined
): ForwardSignal[] {
  if (!source) return signals;
  const arr = Array.isArray(source) ? source : [source];
  if (arr.length === 0) return signals;
  const set = new Set(arr);
  return signals.filter((s) => set.has(s.source));
}

/** 按股票代码过滤 */
export function filterByCode(
  signals: ForwardSignal[],
  code: StockCode | StockCode[] | undefined
): ForwardSignal[] {
  if (!code) return signals;
  const arr = Array.isArray(code) ? code : [code];
  if (arr.length === 0) return signals;
  const set = new Set(arr);
  return signals.filter((s) => set.has(s.code));
}

/** 去重（同 code + source + view + title 视为重复，保留先出现的） */
export function dedupeSignals(signals: ForwardSignal[]): ForwardSignal[] {
  const seen = new Set<string>();
  const out: ForwardSignal[] = [];
  for (const s of signals) {
    const key = `${s.code}|${s.source}|${s.view}|${s.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** 按 publishedAt 倒序排（无 publishedAt 的排到末尾） */
export function sortByPublishedDesc(signals: ForwardSignal[]): ForwardSignal[] {
  return [...signals].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

/** 按 confidence 倒序排（无 confidence 的视为 0.5） */
export function sortByConfidenceDesc(signals: ForwardSignal[]): ForwardSignal[] {
  return [...signals].sort((a, b) => {
    const ca = a.confidence ?? 0.5;
    const cb = b.confidence ?? 0.5;
    return cb - ca;
  });
}

/** 按股票代码分组：返回 Map<code, ForwardSignal[]> */
export function groupByCode(
  signals: ForwardSignal[]
): Map<StockCode, ForwardSignal[]> {
  const map = new Map<StockCode, ForwardSignal[]>();
  for (const s of signals) {
    const arr = map.get(s.code);
    if (arr) arr.push(s);
    else map.set(s.code, [s]);
  }
  return map;
}

/** 按 view 分组：返回 Map<view, ForwardSignal[]> */
export function groupByView(
  signals: ForwardSignal[]
): Map<ForwardView, ForwardSignal[]> {
  const map = new Map<ForwardView, ForwardSignal[]>();
  for (const s of signals) {
    const arr = map.get(s.view);
    if (arr) arr.push(s);
    else map.set(s.view, [s]);
  }
  return map;
}

/** 按 source 分组：返回 Map<source, ForwardSignal[]> */
export function groupBySource(
  signals: ForwardSignal[]
): Map<ForwardSource, ForwardSignal[]> {
  const map = new Map<ForwardSource, ForwardSignal[]>();
  for (const s of signals) {
    const arr = map.get(s.source);
    if (arr) arr.push(s);
    else map.set(s.source, [s]);
  }
  return map;
}

/** 一站式："过滤 + 去重 + 排序"（前端列表通用） */
export function pipeline(
  signals: ForwardSignal[],
  opts: {
    view?: ForwardView;
    source?: ForwardSource | ForwardSource[];
    code?: StockCode | StockCode[];
    sort?: 'published' | 'confidence';
  } = {}
): ForwardSignal[] {
  let out = signals;
  out = filterByView(out, opts.view);
  out = filterBySource(out, opts.source);
  out = filterByCode(out, opts.code);
  out = dedupeSignals(out);
  out = opts.sort === 'confidence' ? sortByConfidenceDesc(out) : sortByPublishedDesc(out);
  return out;
}

// ---------------------------------------------------------------------------
// 统计工具
// ---------------------------------------------------------------------------

export interface SignalStats {
  total: number;
  byView: Record<ForwardView, number>;
  bySource: Record<ForwardSource, number>;
  /** 净看多情绪 = (bullish - bearish) / total，范围 [-1, 1] */
  netSentiment: number;
}

/** 统计一组信号的 view / source 分布 + 净情绪 */
export function statsOf(signals: ForwardSignal[]): SignalStats {
  const byView: Record<ForwardView, number> = { bullish: 0, bearish: 0, neutral: 0 };
  const bySource: Record<ForwardSource, number> = {
    xueqiu: 0,
    analyst: 0,
    news: 0,
    internal: 0,
  };
  for (const s of signals) {
    byView[s.view] += 1;
    bySource[s.source] += 1;
  }
  const total = signals.length;
  const netSentiment = total === 0 ? 0 : (byView.bullish - byView.bearish) / total;
  return { total, byView, bySource, netSentiment };
}
