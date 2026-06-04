# AGENTS.md · 金融情报站 V0.2

> 主线程工作上下文。Agent 启动时**先读本文件**。

## 项目位置
- 代码：`/Users/fengchen/finance-intel/code/finance-intel-web/`
- 文档：`/Users/fengchen/finance-intel/docs/`
- 脚本：`/Users/fengchen/finance-intel/scripts/`

## V0.2 数据源接入 V2 重建记录

### 背景
- **2026-06-04 上午：** Agent#4 首次创建 V0.2 数据源模块 6 个文件（`lib/data-sources/` 下 forward-signals.ts / yahoo.ts / snowball.ts / mock-forward-signals.ts / index.ts + README.md）。
- **2026-06-04 上午（被吃）：** 主线程合并 commit 时执行 `git reset + clean`，把这批新文件误删；reflog 恢复尝试未成功。
- **2026-06-04 10:01：** Agent#4 收到返工任务，V2 重建本批文件。

### V2 重建要点
- 文件位置不变：`code/finance-intel-web/lib/data-sources/`
- 文件清单（6 个 tracked）：
  - `forward-signals.ts` — 类型 + view/source 标签 + filter/sort/group 工具
  - `yahoo.ts` — `yahoo-finance2` 懒加载封装（用 `@ts-expect-error` 让 build 在包未装时也通过）
  - `snowball.ts` — `snowball-cli` spawn 封装（8s 超时、ENOENT 静默降级）
  - `mock-forward-signals.ts` — 38 只股票 × 1-2 条 mock 信号（VIEW1_PLAN 14/10/14 + VIEW2_PLAN 9/9/8 = 23/19/22 = 64 条）
  - `index.ts` — 统一对外接口 `getQuote` / `getFundamentals` / `getForwardSignals`
  - `README.md` — 用法、降级策略
- 辅助文件：`stock-meta.ts`（38 只种子股精简 meta 索引）
- 验证：`npx tsc --noEmit` 干净（0 errors）

### 护栏：verify-data-sources.sh
- **位置：** `~/finance-intel/scripts/verify-data-sources.sh`
- **作用：** 验证 6 个数据源文件**全部在 git tracked 列表**；不通过则 exit 1，阻止 commit
- **用法：**
  - 手动跑：`bash scripts/verify-data-sources.sh`
  - pre-commit hook：可选加 `ln -sf ../../scripts/verify-data-sources.sh .git/hooks/pre-commit`（v2 暂未挂）
- **触发失败的修复流程：**
  ```bash
  git add code/finance-intel-web/lib/data-sources/
  git commit -m "feat(V0.2.1): 数据源接入模块重建"
  ```

### 降级策略（保留给后续 Agent）
1. 美股/港股：yahoo-finance2（包未装 → 走 seed）
2. A 股/港股：snowball-cli spawn（CLI 未装 → 走 seed）
3. 兜底：`public/data/seed-stocks.json` + 64 条 mock signals
4. **所有 fetch* 函数永不抛异常**。

## V0.2 后续 TODO（移交）
- [ ] V0.2.2：API Route 接入（`/api/quote/[code]` / `/api/forward-signals`）
- [ ] V0.2.3：前端 `ForwardSignalsPanel` 组件
- [ ] V0.2.4：Redis 缓存层（5 分钟 TTL）
- [ ] V0.2.5：Finnhub / NewsAPI 接入
- [ ] V0.3.0：AI 三色标签自动打标（virattt/ai-hedge-fund prompt 模板）

## 数据源参考文档
- `docs/open-source-survey.md` — 14+ 项目侦察报告（第二节有详细 API 选型）
- `docs/v0.2-plan.md` — V0.2 实施计划（如有）

## 关键技术决策
- **不装 yahoo-finance2 / snowball-cli 依赖**：V0.2 阶段只走 mock；真包由 V0.2.2 API Route 阶段按需装
- **不引入新依赖到 lib/**：所有文件纯 TypeScript + Node.js 内置 API
- **类型严格**：tsconfig.json `strict: true`，所有 fetch 函数返回 `T | null` 而非 throw
