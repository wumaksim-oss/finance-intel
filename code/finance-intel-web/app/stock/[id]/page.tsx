// 标的详情页 /stock/[id]
// 显示三色标签 + 投资逻辑 + 风险点 + 反馈按钮

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchStocks, fetchTracks, marketLabel, marketColor } from '@/lib/data';
import { TagGroup, TagBadge } from '@/components/TagBadge';
import { FeedbackBar } from '@/components/FeedbackBar';
import { Loading, ErrorState } from '@/components/Loading';
import type { Metadata } from 'next';
import type { TagEmoji } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const stocks = await fetchStocks();
    const stock = stocks.find((s) => s.id === id);
    if (!stock) return { title: '标的未找到 · 金融情报站' };
    return {
      title: `${stock.name} (${stock.code}) · 金融情报站`,
      description: stock.logic?.long || stock.logic?.mid || stock.logic?.short || `${stock.name} (${stock.code}) 标的详情`,
    };
  } catch {
    return { title: '金融情报站' };
  }
}

const KEY_LABELS = {
  V: { name: '长期价值', emoji: '🟢', color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' },
  T: { name: '中期趋势', emoji: '🟡', color: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900' },
  E: { name: '短期事件', emoji: '🔴', color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' },
} as const;

const LOGIC_KEYS = [
  { logicKey: 'long' as const, tagKey: 'V' as const, title: '长期价值逻辑' },
  { logicKey: 'mid' as const, tagKey: 'T' as const, title: '中期趋势逻辑' },
  { logicKey: 'short' as const, tagKey: 'E' as const, title: '短期事件逻辑' },
];

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let stocks;
  let tracks;
  let error: string | null = null;
  try {
    [stocks, tracks] = await Promise.all([fetchStocks(), fetchTracks()]);
  } catch (e) {
    error = e instanceof Error ? e.message : '未知错误';
  }

  if (error) return <ErrorState message={error} />;
  if (!stocks || !tracks) return <Loading label="加载标的中..." />;

  const stock = stocks.find((s) => s.id === id);
  if (!stock) notFound();

  const track = tracks.find((t) => t.id === stock.track);

  const isUp = stock.changePercent >= 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* 返回按钮 */}
      <Link
        href={track ? `/track/${track.id}` : '/'}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        ← 返回{track ? ` ${track.name}` : '首页'}
      </Link>

      {/* 基础信息头部 */}
      <header className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${marketColor(stock.market)}`}>
              {marketLabel(stock.market)}
            </span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {stock.industry}
            </span>
            {track && (
              <Link
                href={`/track/${track.id}`}
                className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
              >
                所属赛道：{track.name}
              </Link>
            )}
            {stock.updatedAt && (
              <span className="ml-auto text-xs text-zinc-400">
                数据更新：{stock.updatedAt}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mb-1 text-3xl font-bold">
                {stock.name}{' '}
                <span className="text-base font-normal text-zinc-500">{stock.code}</span>
              </h1>
              {stock.nameEn && (
                <p className="text-sm text-zinc-500">{stock.nameEn}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stock.price.toFixed(2)}</div>
              <div className={`text-base font-semibold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                {isUp ? '+' : ''}
                {stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-zinc-500">三色标签：</span>
            <TagGroup tags={stock.tags} size="md" />
          </div>

          {(stock.logic?.long || stock.logic?.mid || stock.logic?.short) && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              💡 {stock.logic?.long || stock.logic?.mid || stock.logic?.short}
            </div>
          )}
        </div>
      </header>

      {/* 标签触发原因 */}
      {stock.tagReasons && Object.keys(stock.tagReasons).length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold">标签触发原因</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['V', 'T', 'E'] as const).map((key) => {
              const reason = stock.tagReasons?.[key];
              if (!reason) return null;
              const label = KEY_LABELS[key];
              return (
                <div
                  key={key}
                  className={`rounded-xl border p-3 ${label.color}`}
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <TagBadge tag={label.emoji as TagEmoji} size="sm" />
                    <span className="text-sm font-semibold">{label.name}</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">{reason}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 投资逻辑（结构化） */}
      {stock.logic && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold">投资逻辑</h2>
          <div className="space-y-3">
            {LOGIC_KEYS.map(({ logicKey, tagKey, title }) => {
              const content = stock.logic?.[logicKey];
              if (!content) return null;
              const label = KEY_LABELS[tagKey];
              return (
                <div
                  key={logicKey}
                  className={`rounded-xl border p-4 ${label.color}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <TagBadge tag={label.emoji as TagEmoji} size="sm" />
                    <span className="text-sm font-semibold">{title}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {content}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 催化剂 + 风险点 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stock.catalysts && stock.catalysts.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              ⚡ 近期催化剂
            </h3>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {stock.catalysts.map((c, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-zinc-400">·</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {stock.risks && stock.risks.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              ⚠️ 风险点
            </h3>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {stock.risks.map((r, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-zinc-400">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 数据源 */}
      {stock.dataSources && stock.dataSources.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            🔗 数据源
          </h3>
          <ul className="space-y-1 text-xs text-zinc-500">
            {stock.dataSources.map((src, i) => {
              if (src.startsWith('http')) {
                return (
                  <li key={i}>
                    <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {src}
                    </a>
                  </li>
                );
              }
              return (
                <li key={i} className="text-zinc-500">
                  {src}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 反馈按钮 */}
      <section className="mb-6">
        <FeedbackBar stockId={stock.id} />
      </section>
    </div>
  );
}
