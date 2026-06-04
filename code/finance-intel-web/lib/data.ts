// 数据获取工具 - 服务端直接读 public/data/*.json

import { promises as fs } from 'fs';
import path from 'path';
import type { Track, Stock, Market, TagEmoji, TagKey } from './types';
import { EMOJI_TO_KEY, KEY_TO_EMOJI } from './types';

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const TRACKS_PATH = path.join(DATA_DIR, 'seed-tracks.json');
const STOCKS_PATH = path.join(DATA_DIR, 'seed-stocks.json');

// 服务端缓存（dev hot-reload 友好）
let tracksCache: Track[] | null = null;
let stocksCache: Stock[] | null = null;

async function readJson<T>(filePath: string): Promise<T> {
  const buf = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(buf) as T;
}

export async function fetchTracks(): Promise<Track[]> {
  if (tracksCache) return tracksCache;
  tracksCache = await readJson<Track[]>(TRACKS_PATH);
  return tracksCache;
}

export async function fetchStocks(): Promise<Stock[]> {
  if (stocksCache) return stocksCache;
  stocksCache = await readJson<Stock[]>(STOCKS_PATH);
  return stocksCache;
}

export async function fetchTrack(id: string): Promise<Track | undefined> {
  const tracks = await fetchTracks();
  return tracks.find((t) => t.id === id);
}

export async function fetchStock(id: string): Promise<Stock | undefined> {
  const stocks = await fetchStocks();
  return stocks.find((s) => s.id === id);
}

export function marketLabel(market: Market | string): string {
  switch (market) {
    case 'US':
      return '美股';
    case 'CN':
      return 'A股';
    case 'HK':
      return '港股';
    default:
      return market;
  }
}

export function marketColor(market: Market | string): string {
  switch (market) {
    case 'US':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'CN':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'HK':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
    default:
      return 'bg-zinc-100 text-zinc-700';
  }
}

export function tagsToKeys(tags: TagEmoji[]): TagKey[] {
  return tags.map((t) => EMOJI_TO_KEY[t]);
}

export function keysToEmoji(keys: TagKey[]): TagEmoji[] {
  return keys.map((k) => KEY_TO_EMOJI[k]);
}
