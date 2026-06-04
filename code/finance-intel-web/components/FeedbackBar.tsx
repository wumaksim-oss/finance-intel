// FeedbackBar - 标的详情页底部的反馈按钮组
// 4 个按钮：👍 / 👎 / 已买入 / 已卖出
// 点击后：console.log + localStorage 记录 + Toast 提示

'use client';

import { useState, useEffect } from 'react';

type FeedbackType = 'like' | 'dislike' | 'bought' | 'sold';

interface FeedbackBarProps {
  stockId: string;
}

const FEEDBACK_OPTIONS: {
  type: FeedbackType;
  emoji: string;
  label: string;
  color: string;
}[] = [
  { type: 'like', emoji: '👍', label: '看好', color: 'hover:bg-green-50 dark:hover:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' },
  { type: 'dislike', emoji: '👎', label: '不看好', color: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300' },
  { type: 'bought', emoji: '💰', label: '已买入', color: 'hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' },
  { type: 'sold', emoji: '📉', label: '已卖出', color: 'hover:bg-red-50 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' },
];

const STORAGE_KEY = 'finance-intel-feedback';

interface ToastState {
  visible: boolean;
  message: string;
}

export function FeedbackBar({ stockId }: FeedbackBarProps) {
  const [activeType, setActiveType] = useState<FeedbackType | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  // 从 localStorage 读取已记录的反馈
  useEffect(() => {
    // 延迟到客户端水合后再读取 localStorage
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const all = JSON.parse(raw) as Record<string, FeedbackType>;
          setActiveType(all[stockId] || null);
        }
      } catch (e) {
        console.warn('读取反馈记录失败', e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [stockId]);

  function handleClick(type: FeedbackType) {
    const option = FEEDBACK_OPTIONS.find((o) => o.type === type);
    if (!option) return;

    const record = {
      stockId,
      type,
      timestamp: new Date().toISOString(),
    };

    // 1. 控制台 log
    console.log('[feedback]', record);

    // 2. 写入 localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, FeedbackType>) : {};
      all[stockId] = type;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setActiveType(type);
    } catch (e) {
      console.warn('写入反馈记录失败', e);
    }

    // 3. Toast 提示
    setToast({ visible: true, message: `已记录：${option.emoji} ${option.label}` });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 1800);
  }

  return (
    <div className="relative">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          💬 我的反馈（本地记录，仅用于反哺评分模型）
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FEEDBACK_OPTIONS.map((option) => {
            const isActive = activeType === option.type;
            return (
              <button
                key={option.type}
                onClick={() => handleClick(option.type)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all active:scale-95 ${option.color} ${
                  isActive
                    ? 'border-current ring-2 ring-current ring-offset-2 dark:ring-offset-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
                type="button"
              >
                <span className="text-2xl">{option.emoji}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      <div
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
