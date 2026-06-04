// TagBadge - 三色标签组件（接受 emoji 输入，内部映射为 V/T/E）
// 🟢 V = 长期价值
// 🟡 T = 中期趋势
// 🔴 E = 短期事件

import type { TagEmoji } from '@/lib/types';
import { EMOJI_TO_KEY } from '@/lib/types';

interface TagBadgeProps {
  tag: TagEmoji;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const KEY_CONFIG: Record<
  'V' | 'T' | 'E',
  { bg: string; ring: string; fullName: string; description: string; emoji: string }
> = {
  V: {
    bg: 'bg-green-500 text-white',
    ring: 'ring-green-500/30',
    fullName: '长期价值',
    description: '业绩稳健、护城河深',
    emoji: '🟢',
  },
  T: {
    bg: 'bg-yellow-500 text-white',
    ring: 'ring-yellow-500/30',
    fullName: '中期趋势',
    description: '产业拐点、产能周期',
    emoji: '🟡',
  },
  E: {
    bg: 'bg-red-500 text-white',
    ring: 'ring-red-500/30',
    fullName: '短期事件',
    description: '消息面、催化剂',
    emoji: '🔴',
  },
};

export function TagBadge({ tag, size = 'md', showLabel = true }: TagBadgeProps) {
  const key = EMOJI_TO_KEY[tag];
  const config = KEY_CONFIG[key];
  const sizeClasses = {
    sm: 'h-5 min-w-5 px-1 text-[10px]',
    md: 'h-6 min-w-6 px-1.5 text-xs',
    lg: 'h-8 min-w-8 px-2 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center justify-center gap-0.5 rounded-full font-semibold ${config.bg} ${sizeClasses[size]} ring-2 ${config.ring}`}
      title={`${config.fullName} (${key}) - ${config.description}`}
      aria-label={`${config.fullName}标签`}
    >
      <span className="text-[0.9em] leading-none">{config.emoji}</span>
      {showLabel && <span className="leading-none">{key}</span>}
    </span>
  );
}

interface TagGroupProps {
  tags: TagEmoji[];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function TagGroup({ tags, size = 'md', showLabel = true, className = '' }: TagGroupProps) {
  if (!tags || tags.length === 0) {
    return <span className="text-xs text-zinc-400">无标签</span>;
  }
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {tags.map((tag, i) => (
        <TagBadge key={`${tag}-${i}`} tag={tag} size={size} showLabel={showLabel} />
      ))}
    </div>
  );
}
