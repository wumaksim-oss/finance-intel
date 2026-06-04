#!/bin/bash
# verify-data-sources.sh
#
# 验证 V0.2 数据源模块的 6 个文件都已 git tracked。
# 防止 "git reset + clean" 把数据源文件吃掉。
# 用法：
#   bash scripts/verify-data-sources.sh   # 直接跑（失败 exit 1）
#   bash scripts/verify-data-sources.sh || echo "BLOCK COMMIT"   # hook 拦截
#
# 由 Agent#4 (V0.2 数据源接入) 于 2026-06-04 创建。
# 历史背景：2026-06-04 之前 V0.2 首次提交时，主线程 git reset + clean 把
#   lib/data-sources/ 6 个新文件误删，reflog 恢复没回出来。
# 此脚本作为 "commit-time 防误删护栏"。

set -e

cd /Users/fengchen/finance-intel

# 必须 tracked 的 6 个文件
FILES=(
  "code/finance-intel-web/lib/data-sources/forward-signals.ts"
  "code/finance-intel-web/lib/data-sources/yahoo.ts"
  "code/finance-intel-web/lib/data-sources/snowball.ts"
  "code/finance-intel-web/lib/data-sources/mock-forward-signals.ts"
  "code/finance-intel-web/lib/data-sources/index.ts"
  "code/finance-intel-web/lib/data-sources/README.md"
)

MISSING=0
for f in "${FILES[@]}"; do
  # git ls-files --error-unmatch: 文件必须已经在 index
  if ! git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "❌ 缺失（未 tracked）：$f"
    MISSING=$((MISSING + 1))
  else
    echo "✅ tracked: $f"
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "💥 $MISSING 个数据源文件未被 git tracked，commit 被阻止。"
  echo "   修复方法："
  echo "     git add code/finance-intel-web/lib/data-sources/"
  echo "     git commit -m 'feat(V0.2.1): 数据源接入模块重建'"
  exit 1
fi

echo ""
echo "✅ 6 个数据源文件全部 tracked"
exit 0
