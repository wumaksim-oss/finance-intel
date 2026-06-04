// 雪球 CLI 数据源封装（spawn 子进程 + 失败降级）
//
// 策略：
//   1. snowball-cli 是独立 CLI（npm i -g snowball-cli / bun add -g snowball-cli），
//      走子进程调用，不在 build 时 import，避免 Vercel 部署时被 require。
//   2. 找不到 CLI（command not found）→ 静默降级到 null，不抛错。
//   3. JSON 输出用 --json 标志（snowball-cli 的标准输出模式）。
//   4. 超时 8s（防雪球登录态失效导致 hang）。
//
// 接口对齐：https://github.com/baixianger/snowball-cli
//   - snowball quote <SYMBOL> [--detail]            → 实时报价
//   - snowball kol <SYMBOL>                         → KOL 持仓/观点
//   - snowball forecast <SYMBOL>                    → 业绩预测
//   - snowball trending day --count 5              → 雪球热门股
//
// V0.2 当前未装 snowball-cli，所有 fetch* 永远返回 null。降级由 index.ts 处理。

import { spawn } from 'child_process';

/** 雪球报价（精简版） */
export interface SnowballQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  /** 抓取时间戳 */
  asOf: number;
}

/** 雪球 KOL 帖子（原始结构） */
export interface SnowballKolPost {
  /** KOL 用户 ID / 雪球 ID */
  userId: string;
  /** KOL 昵称 */
  userName: string;
  /** 帖子标题 */
  title: string;
  /** 帖子内容（可能截断） */
  content?: string;
  /** 帖子链接 */
  url?: string;
  /** 发布时间 */
  publishedAt?: string;
  /** 转发 / 评论 / 点赞 */
  retweetCount?: number;
  replyCount?: number;
  likeCount?: number;
}

// ---------------------------------------------------------------------------
// 雪球符号归一化
// ---------------------------------------------------------------------------

/**
 * 把 seed 数据里的 code 归一化到 snowball-cli 接受的格式：
 *   - 美股 NVDA           → NVDA
 *   - 港股 00700 / HK00700 → 00700
 *   - A 股 600519 / SH600519 → SH600519
 */
export function normalizeSnowballSymbol(code: string): string {
  const c = code.trim().toUpperCase();
  if (/^(SH|SZ)\d{6}$/.test(c)) return c;
  if (/^\d{6}$/.test(c)) return `SH${c}`;
  if (/^HK\d{5}$/.test(c)) return c.slice(2);
  if (/^\d{5}$/.test(c)) return c;
  return c;
}

// ---------------------------------------------------------------------------
// spawn 工具
// ---------------------------------------------------------------------------

const SNOWBALL_TIMEOUT_MS = 8000;

/** 跑 snowball <args>，stdout 当 JSON 解析；失败 / 超时 / 包不存在 → 返回 null */
async function runSnowball<T = unknown>(args: string[]): Promise<T | null> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (v: T | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };

    let proc;
    try {
      proc = spawn('snowball', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[data-sources/snowball] spawn 失败:', err);
      }
      finish(null);
      return;
    }

    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[data-sources/snowball] 超时（>8s）');
      }
      finish(null);
    }, SNOWBALL_TIMEOUT_MS);

    proc.stdout.on('data', (b: Buffer) => {
      stdout += b.toString('utf-8');
    });
    proc.stderr.on('data', (b: Buffer) => {
      stderr += b.toString('utf-8');
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[data-sources/snowball] 进程错误（CLI 未装？）:', err.message);
      }
      finish(null);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(
            `[data-sources/snowball] 退出码 ${code}，stderr: ${stderr.slice(0, 200)}`
          );
        }
        finish(null);
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as T;
        finish(parsed);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[data-sources/snowball] JSON 解析失败:', err);
        }
        finish(null);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 公开 fetch* 函数
// ---------------------------------------------------------------------------

/** 取雪球实时报价 */
export async function fetchQuote(code: string): Promise<SnowballQuote | null> {
  const sym = normalizeSnowballSymbol(code);
  const raw = await runSnowball<unknown>(['quote', sym, '--json']);
  if (!raw) return null;
  return parseQuote(raw, code);
}

/** 解析 snowball quote 输出（容错：不同版本字段可能略不同） */
function parseQuote(raw: unknown, originalCode: string): SnowballQuote | null {
  // 形态 A：单个对象
  // 形态 B：数组（snowball-cli 早期版本）
  const obj = Array.isArray(raw)
    ? (raw[0] as Record<string, unknown> | undefined)
    : (raw as Record<string, unknown> | undefined);
  if (!obj || typeof obj !== 'object') return null;

  const price = num(obj.current ?? obj.price ?? obj.last);
  if (price == null) return null;
  const change = num(obj.change ?? obj.chg) ?? 0;
  const changePct =
    num(obj.percent ?? obj.changePercent ?? obj.pctChange) ?? 0;

  return {
    symbol: String(obj.symbol ?? originalCode),
    name: obj.name ? String(obj.name) : undefined,
    price,
    change,
    changePercent: changePct,
    currency: obj.currency ? String(obj.currency) : 'CNY',
    asOf: Date.now(),
  };
}

/** 取某只股票的雪球 KOL 帖子 */
export async function fetchKolPosts(
  code: string,
  limit = 5
): Promise<SnowballKolPost[]> {
  const sym = normalizeSnowballSymbol(code);
  const raw = await runSnowball<unknown>(['kol', sym, '--count', String(limit), '--json']);
  if (!raw) return [];
  return parseKolPosts(raw);
}

/** 解析 snowball kol 输出。形态可能是 { list: [...] } / [...] / { data: [...] } */
function parseKolPosts(raw: unknown): SnowballKolPost[] {
  const arr =
    Array.isArray(raw)
      ? raw
      : ((raw as Record<string, unknown>).list ??
          (raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).posts ??
          []) as unknown[];
  if (!Array.isArray(arr)) return [];

  const out: SnowballKolPost[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const userId = String(o.userId ?? o.user_id ?? o.uid ?? '');
    const userName = String(o.userName ?? o.user_name ?? o.screen_name ?? '匿名');
    const title = String(o.title ?? o.text ?? o.content ?? '').slice(0, 200);
    if (!title) continue;
    out.push({
      userId,
      userName,
      title,
      content: o.content ? String(o.content) : undefined,
      url: o.url ? String(o.url) : undefined,
      publishedAt: o.created_at
        ? String(o.created_at)
        : o.publishedAt
        ? String(o.publishedAt)
        : undefined,
      retweetCount: num(o.retweet_count ?? o.retweetCount) ?? undefined,
      replyCount: num(o.reply_count ?? o.replyCount) ?? undefined,
      likeCount: num(o.like_count ?? o.likeCount) ?? undefined,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// KOL 帖子 → ForwardSignal
// ---------------------------------------------------------------------------

import type { ForwardSignal, ForwardView } from './forward-signals';

/** 简单关键词判断 view（避免引入 NLP 依赖） */
function inferView(text: string): ForwardView {
  const t = text.toLowerCase();
  const bullWords = ['看多', '加仓', '买入', '看好', '上涨', '突破', '目标价', '加注', '满仓', '强烈推荐'];
  const bearWords = ['看空', '减仓', '卖出', '看跌', '下跌', '回调', '止损', '风险', '泡沫', '高估'];
  let bull = 0;
  let bear = 0;
  for (const w of bullWords) if (t.includes(w.toLowerCase())) bull += 1;
  for (const w of bearWords) if (t.includes(w.toLowerCase())) bear += 1;
  if (bull > bear) return 'bullish';
  if (bear > bull) return 'bearish';
  return 'neutral';
}

/** 把一条 KOL 帖子转成一条 ForwardSignal */
export function kolPostToSignal(
  post: SnowballKolPost,
  code: string
): ForwardSignal {
  const view = inferView(`${post.title} ${post.content ?? ''}`);
  const title = post.title.length > 30 ? post.title.slice(0, 30) + '…' : post.title;
  return {
    id: `${code}:xueqiu:${view}:${hashStr(post.title)}`,
    code,
    view,
    source: 'xueqiu',
    title: `[${post.userName}] ${title}`,
    summary: post.content?.slice(0, 120),
    url: post.url,
    author: post.userName,
    publishedAt: post.publishedAt,
    confidence: 0.6,
  };
}

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 简单字符串 hash（djb2），用于生成稳定 ID */
function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}
