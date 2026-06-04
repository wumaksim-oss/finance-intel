// 共享类型定义 - 匹配 seed-stocks.json / seed-tracks.json 实际结构

export type Market = 'US' | 'CN' | 'HK';

// 三色标签用 emoji 字符串（与 seed 数据一致）
export type TagEmoji = '🟢' | '🟡' | '🔴';

// 兼容 V/T/E 字母简写（用于内部逻辑）
export type TagKey = 'V' | 'T' | 'E';

export const EMOJI_TO_KEY: Record<TagEmoji, TagKey> = {
  '🟢': 'V',
  '🟡': 'T',
  '🔴': 'E',
};

export const KEY_TO_EMOJI: Record<TagKey, TagEmoji> = {
  V: '🟢',
  T: '🟡',
  E: '🔴',
};

// 投资逻辑（与 seed 数据一致：long/mid/short）
export interface InvestmentLogic {
  long?: string; // 长期价值
  mid?: string;  // 中期趋势
  short?: string; // 短期事件
}

// 标签触发原因（与 seed 数据一致：tagReasons.V/T/E）
export interface TagReasons {
  V?: string;
  T?: string;
  E?: string;
}

export interface Stock {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  market: Market;
  track: string; // 所属赛道 ID
  industry: string;
  price: number;
  changePercent: number;
  tags: TagEmoji[]; // ['🟢', '🟡']
  tagReasons?: TagReasons;
  logic?: InvestmentLogic;
  risks?: string[];
  catalysts?: string[];
  dataSources?: string[];
  updatedAt?: string;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  category: string;
  heatScore: number;
  tags: TagEmoji[];
  markets: Market[];
  stockIds: string[];
  lastEvent: string;
  keyEvent: string;
}
