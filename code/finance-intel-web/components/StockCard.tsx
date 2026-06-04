// StockCard - 股票卡片（赛道详情页 + 通用列表用）

import Link from 'next/link';
import type { Stock } from '@/lib/types';
import { TagGroup } from './TagBadge';
import { marketColor, marketLabel } from '@/lib/data';

interface StockCardProps {
  stock: Stock;
}

export function StockCard({ stock }: StockCardProps) {
  const isUp = stock.changePercent >= 0;
  return (
    <Link
      href={`/stock/${stock.id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50">
              {stock.name}
            </span>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${marketColor(stock.market)}`}
            >
              {marketLabel(stock.market)}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {stock.code} · {stock.industry}
          </div>
        </div>
        <TagGroup tags={stock.tags} size="sm" />
      </div>

      {stock.tagReasons && (
        <p className="mb-2 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-500">
          {Object.values(stock.tagReasons).filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="flex items-end justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {stock.price.toFixed(2)}
          </div>
        </div>
        <div
          className={`text-sm font-semibold ${isUp ? 'text-red-500' : 'text-green-500'}`}
        >
          {isUp ? '+' : ''}
          {stock.changePercent.toFixed(2)}%
        </div>
      </div>
    </Link>
  );
}
