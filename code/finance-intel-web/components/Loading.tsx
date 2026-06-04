// Loading - 通用加载占位

export function Loading({ label = '加载中...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
        <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="text-4xl">⚠️</div>
      <div className="text-sm text-red-600 dark:text-red-400">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          重试
        </button>
      )}
    </div>
  );
}
