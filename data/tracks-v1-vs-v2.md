# V0.1 ↔ V0.2 赛道分类对照表

> **变更要点**：V0.1 是手写 10 个赛道，V0.2 在保留 id/name 不变的前提下，把每个赛道映射到 `JerBouma/FinanceDatabase` 的 sector / industry 体系。新文件 `seed-tracks-v2.json` 增加 4 个字段：`source` / `fdSector` / `categories` / `industryKeywords` / `stockCount` / `lastUpdated`。`seed-stocks.json` 在保留 `track` 的同时新增 `trackId` 字段（与 `track` 同值），为 V0.3 多赛道打标预留空间。

---

## 一、总览表（V0.1 手写 → V0.2 FinanceDatabase）

| V0.1 赛道 ID | V0.1 名称 | V0.2 FD Sector | V0.2 FD Categories（细分） | FD 收录数 | 当前示例股数 |
|---|---|---|---|---:|---:|
| `track-ai-compute` | AI 算力 | **Information Technology** | Semiconductors & Semiconductor Equipment<br>Technology Hardware, Storage & Peripherals<br>Software | 1,847 | 6 |
| `track-innovative-drugs` | 创新药 | **Health Care** | Pharmaceuticals, Biotechnology & Life Sciences<br>Health Care Equipment & Services | 2,634 | 4 |
| `track-ev` | 新能源车 | **Consumer Discretionary** | Automobiles & Components<br>Consumer Durables & Apparel | 942 | 5 |
| `track-energy-storage` | 储能 | **Industrials** | Electrical Equipment<br>Capital Goods<br>Utilities | 1,156 | 2 |
| `track-semiconductor-equipment` | 半导体设备 | **Information Technology** | Semiconductors & Semiconductor Equipment | 612 | 4 |
| `track-consumer-recovery` | 消费复苏 | **Consumer Staples** | Food, Beverage & Tobacco<br>Consumer Staples Distribution & Retail<br>Consumer Discretionary Distribution & Retail | 2,103 | 4 |
| `track-crypto` | 数字货币 / 区块链 | **Financials** | Financial Services<br>Software | 487 | 3 |
| `track-robotics` | 机器人 | **Industrials** | Machinery, Investments, Construction & Transportation<br>Capital Goods | 768 | 3 |
| `track-aerospace` | 商业航天 | **Industrials** | Capital Goods | 423 | 3 |
| `track-advanced-manufacturing` | 高端制造 | **Industrials** | Capital Goods<br>Machinery, Investments, Construction & Transportation | 3,287 | 4 |

**汇总**：V0.1 = 10 个手写赛道；V0.2 = 10 个手写赛道 + 14,259 个 FD 行业标的池。

---

## 二、详细映射（每个赛道的 FD industry 关键词）

### AI 算力 (`track-ai-compute`)

- **FD Sector**: `Information Technology`
- **FD Categories** (3 个):
  - `Semiconductors & Semiconductor Equipment`
  - `Technology Hardware, Storage & Peripherals`
  - `Software`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Semiconductors`
  - `Technology Hardware, Storage & Peripherals`
  - `Application Software`
  - `Systems Software`
- **FD 收录数**: 1,847 只
- **当前示例股数**: 6 只

### 创新药 (`track-innovative-drugs`)

- **FD Sector**: `Health Care`
- **FD Categories** (2 个):
  - `Pharmaceuticals, Biotechnology & Life Sciences`
  - `Health Care Equipment & Services`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Pharmaceuticals`
  - `Biotechnology`
  - `Health Care Equipment`
  - `Health Care Supplies`
- **FD 收录数**: 2,634 只
- **当前示例股数**: 4 只

### 新能源车 (`track-ev`)

- **FD Sector**: `Consumer Discretionary`
- **FD Categories** (2 个):
  - `Automobiles & Components`
  - `Consumer Durables & Apparel`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Automobile Manufacturers`
  - `Automobile Components`
  - `Motorcycles & Scooters`
  - `Household Appliances`
- **FD 收录数**: 942 只
- **当前示例股数**: 5 只

### 储能 (`track-energy-storage`)

- **FD Sector**: `Industrials`
- **FD Categories** (3 个):
  - `Electrical Equipment`
  - `Capital Goods`
  - `Utilities`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Electrical Components & Equipment`
  - `Heavy Electrical Equipment`
  - `Construction & Engineering`
  - `Electric Utilities`
  - `Independent Power Producers & Renewable Electricity`
- **FD 收录数**: 1,156 只
- **当前示例股数**: 2 只

### 半导体设备 (`track-semiconductor-equipment`)

- **FD Sector**: `Information Technology`
- **FD Categories** (1 个):
  - `Semiconductors & Semiconductor Equipment`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Semiconductor Materials & Equipment`
  - `Semiconductors`
- **FD 收录数**: 612 只
- **当前示例股数**: 4 只

### 消费复苏 (`track-consumer-recovery`)

- **FD Sector**: `Consumer Staples`
- **FD Categories** (3 个):
  - `Food, Beverage & Tobacco`
  - `Consumer Staples Distribution & Retail`
  - `Consumer Discretionary Distribution & Retail`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Beverages`
  - `Food Products`
  - `Tobacco`
  - `Consumer Staples Merchandise Retail`
  - `Broadline Retail`
  - `Specialty Retail`
- **FD 收录数**: 2,103 只
- **当前示例股数**: 4 只

### 数字货币 / 区块链 (`track-crypto`)

- **FD Sector**: `Financials`
- **FD Categories** (2 个):
  - `Financial Services`
  - `Software`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Transaction & Payment Processing Services`
  - `Capital Markets`
  - `Application Software`
- **FD 收录数**: 487 只
- **当前示例股数**: 3 只
- **备注**: FinanceDatabase 主要覆盖股票标的；BTC/ETH 等原生加密资产走 CoinGecko / Cryptocurrencies 表 (3,367 symbols)，本赛道仅覆盖关联股票（交易所/矿企/资管平台）

### 机器人 (`track-robotics`)

- **FD Sector**: `Industrials`
- **FD Categories** (2 个):
  - `Machinery, Investments, Construction & Transportation`
  - `Capital Goods`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Industrial Machinery & Supplies & Components`
  - `Trading Companies & Distributors`
  - `Construction Machinery & Heavy Transportation Equipment`
  - `Electrical Equipment`
- **FD 收录数**: 768 只
- **当前示例股数**: 3 只

### 商业航天 (`track-aerospace`)

- **FD Sector**: `Industrials`
- **FD Categories** (1 个):
  - `Capital Goods`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Aerospace & Defense`
  - `Construction & Engineering`
- **FD 收录数**: 423 只
- **当前示例股数**: 3 只

### 高端制造 (`track-advanced-manufacturing`)

- **FD Sector**: `Industrials`
- **FD Categories** (2 个):
  - `Capital Goods`
  - `Machinery, Investments, Construction & Transportation`
- **Industry 关键词** (用于 V0.3 跨表 join 候选标的):
  - `Industrial Conglomerates`
  - `Construction Machinery & Heavy Transportation Equipment`
  - `Industrial Machinery & Supplies & Components`
  - `Electrical Equipment`
- **FD 收录数**: 3,287 只
- **当前示例股数**: 4 只

---

## 三、字段变更清单

### `seed-tracks-v2.json`（相对 V0.1 新增）

| 字段 | 类型 | 说明 |
|---|---|---|
| `source` | string | 固定为 `"FinanceDatabase"`，标识赛道来源 |
| `fdSector` | string | FD 的 11 个 sector 之一（如 `Information Technology`） |
| `categories` | string[] | FD 的细分 industry group（68 个 industry 之一） |
| `industryKeywords` | string[] | 更细的 industry 关键词（V0.3 跨表 join 用） |
| `stockCount` | number | FD 中匹配该赛道的标的数（mock 估值，V0.3 跑 `financedatabase` 校准） |
| `lastUpdated` | string (YYYY-MM-DD) | 数据更新日期 |
| `note` | string? | 可选备注（如加密赛道只覆盖关联股票） |

### `seed-stocks.json`（相对 V0.1 新增）

| 字段 | 类型 | 说明 |
|---|---|---|
| `trackId` | string | 与现有 `track` 字段同值；为 V0.3 多赛道打标预留 |

> ⚠️ **未改动**：`id` / `code` / `name` / `nameEn` / `market` / `track` / `industry` / `price` / `changePercent` / `tags` / `tagReasons` / `logic` / `risks` / `catalysts` / `dataSources` / `updatedAt`

---

## 四、兼容性 & 后续

1. **V0.1 兼容**：所有 V0.1 代码若读 `track` 字段仍能跑（38 只股票 `trackId === track`）。
2. **V0.2 读法**：赛道卡片组件可读 `categories[0]` 作为副标题；详情页可读 `stockCount` 展示赛道池子大小。
3. **V0.3 路线**：
   - 把 FD 30 万标的跑 `pip install financedatabase` 后，按 `categories` join 进 `seed-stocks.json`（自动扩容到 14,259 条候选）。
   - 给单只股票增加 `tracks: string[]` 数组（一只股票可同时属多个赛道，如 TSLA ∈ ev + energy-storage + robotics）。
   - 替换 `trackId` 单值字段 → `trackIds: string[]` 数组。

---

_生成于 2026-06-04 · Agent #6 (finance-intel V0.2 赛道分类升级)_
