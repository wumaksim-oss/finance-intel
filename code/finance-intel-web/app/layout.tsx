import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '金融情报站 · 跨市场前瞻赛道 + 个股可投性分析',
  description:
    '自用型跨市场（美股+A股+港股）金融情报站，聚焦"前瞻赛道发现 + 个股可投性分析"，三色标签系统直观呈现投资逻辑。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50"
            >
              <span className="text-xl">📊</span>
              <span>金融情报站</span>
              <span className="hidden rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
                V0.1 MVP
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                赛道
              </Link>
              <a
                href="https://github.com"
                className="hidden hover:text-zinc-900 sm:inline dark:hover:text-zinc-50"
                target="_blank"
                rel="noreferrer"
              >
                关于
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>

        <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>金融情报站 V0.1 MVP · 自用型 · 数据为静态种子，V0.2 将接实时源</div>
          <div className="mt-1">三色标签：🟢 长期价值 · 🟡 中期趋势 · 🔴 短期事件</div>
        </footer>
      </body>
    </html>
  );
}
