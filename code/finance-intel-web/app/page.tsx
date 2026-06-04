// 首页 / 赛道看板
// 显示 Top 10 赛道，按 heatScore 倒序

import { fetchTracks, fetchStocks } from '@/lib/data';
import { TrackCard } from '@/components/TrackCard';
import { Loading, ErrorState } from '@/components/Loading';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let tracks: Awaited<ReturnType<typeof fetchTracks>> | null = null;
  let stocks: Awaited<ReturnType<typeof fetchStocks>> = [];
  let error: string | null = null;

  try {
    const [t, s] = await Promise.all([fetchTracks(), fetchStocks()]);
    tracks = t;
    stocks = s;
  } catch (e) {
    error = e instanceof Error ? e.message : '未知错误';
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!tracks) {
    return <Loading label="加载赛道中..." />;
  }

  // 按 heatScore 倒序
  const sortedTracks = [...tracks].sort((a, b) => b.heatScore - a.heatScore);

  return (
    <div>
      {/* Hero 介绍区 */}
      <section className="mb-8">
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 sm:p-8 dark:border-zinc-800 dark:from-blue-950/30 dark:via-zinc-900 dark:to-purple-950/30">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
              MVP
            </span>
            <span className="text-xs text-zinc-500">v0.1 · 静态种子数据</span>
          </div>
          <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
            跨市场前瞻赛道 · 个股可投性分析
          </h1>
          <p className="mb-4 max-w-2xl text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            自用型金融情报站，覆盖 <strong>美股 / A股 / 港股</strong> 三地市场。
            聚焦 10 个核心赛道，每只标的用 <span className="font-semibold text-green-600 dark:text-green-400">三色标签</span> 标记：
            <span className="mx-1">🟢 长期价值</span>·
            <span className="mx-1">🟡 中期趋势</span>·
            <span className="mx-1">🔴 短期事件</span>
            ，快速识别&ldquo;可投性&rdquo;。
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-3 py-1 text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
              📈 {sortedTracks.length} 个赛道
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
              🏷️ {stocks.length} 只标的
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
              🌍 3 个市场
            </span>
          </div>
        </div>
      </section>

      {/* 赛道网格 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold">赛道看板</h2>
            <p className="mt-1 text-sm text-zinc-500">按热度评分排序，点击查看详情</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedTracks.map((track) => (
            <TrackCard key={track.id} track={track} stocks={stocks} />
          ))}
        </div>
      </section>
    </div>
  );
}
