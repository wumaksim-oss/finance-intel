// TrackCard - 赛道卡片（首页用）

import Link from 'next/link';
import type { Track, Stock } from '@/lib/types';
import { marketLabel } from '@/lib/data';

interface TrackCardProps {
  track: Track;
  stocks?: Stock[]; // 可选：用于统计三色标签分布
}

export function TrackCard({ track, stocks = [] }: TrackCardProps) {
  // 该赛道下股票（按 track.stockIds 过滤）
  const trackStocks = stocks.filter((s) => track.stockIds.includes(s.id));

  // 三色标签分布
  const vCount = trackStocks.filter((s) => s.tags.includes('🟢')).length;
  const tCount = trackStocks.filter((s) => s.tags.includes('🟡')).length;
  const eCount = trackStocks.filter((s) => s.tags.includes('🔴')).length;

  return (
    <Link
      href={`/track/${track.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {/* 顶部：类别 + 热度评分 */}
      <div className="mb-3 flex items-start justify-between">
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {track.category}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">热度</span>
          <span className="rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-sm font-bold text-white">
            {track.heatScore}
          </span>
        </div>
      </div>

      {/* 赛道名 */}
      <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {track.name}
      </h3>

      {/* 描述 */}
      <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
        {track.description}
      </p>

      {/* 关键事件 */}
      <div className="mb-4 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
        <div className="mb-0.5 text-[10px] text-zinc-400">📅 {track.lastEvent}</div>
        <div className="line-clamp-2">{track.keyEvent}</div>
      </div>

      {/* 底部：市场 + 股票数 + 三色标签分布 */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          {track.markets.map((m) => (
            <span
              key={m}
              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              title={marketLabel(m)}
            >
              {m}
            </span>
          ))}
          <span className="ml-1 text-xs text-zinc-500">
            {track.stockIds.length} 只标的
          </span>
        </div>

        {/* 三色标签分布条 */}
        <div className="flex items-center gap-1.5">
          {vCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {vCount}
            </span>
          )}
          {tCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              {tCount}
            </span>
          )}
          {eCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {eCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
