// 赛道详情页 /track/[id]
// 显示该赛道下的所有股票

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchTracks, fetchStocks, marketLabel } from '@/lib/data';
import { StockCard } from '@/components/StockCard';
import { Loading, ErrorState } from '@/components/Loading';
import { TagGroup } from '@/components/TagBadge';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const tracks = await fetchTracks();
    const track = tracks.find((t) => t.id === id);
    if (!track) return { title: '赛道未找到 · 金融情报站' };
    return {
      title: `${track.name} · 金融情报站`,
      description: track.description,
    };
  } catch {
    return { title: '金融情报站' };
  }
}

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tracks;
  let stocks;
  let error: string | null = null;
  try {
    [tracks, stocks] = await Promise.all([fetchTracks(), fetchStocks()]);
  } catch (e) {
    error = e instanceof Error ? e.message : '未知错误';
  }

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!tracks || !stocks) {
    return <Loading label="加载赛道详情..." />;
  }

  const track = tracks.find((t) => t.id === id);
  if (!track) {
    notFound();
  }

  // 该赛道下的所有股票
  const trackStocks = stocks.filter((s) => track.stockIds.includes(s.id));

  // 按涨跌幅倒序
  const sortedStocks = [...trackStocks].sort((a, b) => b.changePercent - a.changePercent);

  return (
    <div>
      {/* 返回按钮 */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        ← 返回赛道看板
      </Link>

      {/* 赛道头部 */}
      <header className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {track.category}
            </span>
            {track.markets.map((m) => (
              <span
                key={m}
                className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {marketLabel(m)}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
              热度
              <span className="rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-sm font-bold text-white">
                {track.heatScore}
              </span>
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-bold">{track.name}</h1>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">{track.description}</p>

          <div className="flex items-center gap-2">
            <TagGroup tags={track.tags} size="md" />
            <span className="text-xs text-zinc-400">· 赛道自身标签</span>
          </div>
        </div>

        {/* 最近关键事件 */}
        <div className="bg-zinc-50 p-6 dark:bg-zinc-800/30">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <span>📌</span>
            <span>最近关键事件</span>
            <span className="text-xs font-normal text-zinc-400">· {track.lastEvent}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{track.keyEvent}</p>
        </div>
      </header>

      {/* 标的池 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold">
              标的池 <span className="text-base font-normal text-zinc-500">({trackStocks.length})</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-500">点击查看详情、记录反馈</p>
          </div>
          <div className="hidden text-xs text-zinc-500 sm:block">
            <span className="text-red-500">红</span>=涨 / <span className="text-green-500">绿</span>=跌（中国习惯色）
          </div>
        </div>

        {sortedStocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            该赛道暂无标的
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedStocks.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
