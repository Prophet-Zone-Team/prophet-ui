# World Cup Prediction Terminal
## 数据接入与 Market Signal 开发路线图（Codex 执行版）

> 适用对象：Codex / 开发团队  
> 当前项目状态：已完成基础 UI、首页热力图、球队详情页、Mock Bid、Watchlist、Feed 等前端能力。  
> 下一阶段目标：将产品从 **Mock Demo** 升级为 **真实数据驱动的 C 端预测市场分析平台**。

---

# 1. 当前阶段的核心判断

接下来不应继续无序堆叠页面，而应优先完成：

1. **真实数据底座**
2. **可解释的 Market Signals**
3. **外部赔率对比**
4. **新闻事件解释**
5. **后续再考虑社媒情绪与高级信号**

产品价值不在于页面数量，而在于：

- 用户能不能一眼看懂市场热度；
- 用户能不能理解概率为什么变化；
- 用户能不能看到预测市场与传统赔率之间的分歧；
- 用户能不能基于信息做 watchlist、mock bid 和进一步判断。

---

# 2. 当前产品定位

## 产品名称

**World Cup Prediction Terminal**

## 产品定位

面向 C 端用户的世界杯预测市场数据分析与 Mock Bid 平台。

它不是：

- 传统体育新闻网站；
- 纯博彩网站；
- 真实交易下单平台。

它是：

- 预测市场数据终端；
- 世界杯概率热力图；
- 球队市场情绪与变化解释平台；
- 帮助普通用户理解 Polymarket 类市场的 C 端产品。

---

# 3. 当前阶段要实现的 Market Signals

建议第一阶段聚焦以下 6 个 Signal：

| Signal | 是否需要第三方数据 | 数据来源 | 优先级 |
|---|---:|---|---|
| Heating Up | 否 | Polymarket | P0 |
| Cooling Down | 否 | Polymarket | P0 |
| Volume Spike | 否 | Polymarket | P0 |
| Quiet Accumulation | 否 | Polymarket | P1 |
| Odds Mismatch | 是 | Polymarket + The Odds API | P0 |
| News Impact | 是 | Polymarket + GDELT | P1 |

暂不优先做：

| Signal | 原因 |
|---|---|
| Sentiment Driven | 依赖 X / Reddit / Google Trends，噪音高，接入复杂 |
| Overheated | 属于复合型判断，需市场 + 赔率 + 社媒 / 新闻，适合后置 |
| Social Buzz | 接口、成本、去噪都更复杂 |
| Real Trading Signals | 当前产品不是投资建议平台 |

---

# 4. 这些 Signal 分别需要什么数据？

---

## 4.1 Heating Up

### 含义

某支球队的市场概率上涨，同时成交热度上升。

### 所需数据

- 当前概率；
- 24h 前概率；
- 24h 概率变化；
- 24h 成交量；
- 历史基准成交量。

### 示例逻辑

```text
if probability_24h_change > positive_threshold
and volume_24h > recent_volume_baseline
then Heating Up
```

### 前端表达示例

```text
Brazil is heating up.
Probability rose in the last 24 hours while trading activity accelerated.
```

### 数据来源

- Polymarket

---

## 4.2 Cooling Down

### 含义

球队概率下跌，但成交依然活跃，说明市场在主动下修预期。

### 所需数据

- 当前概率；
- 24h 前概率；
- 24h 概率变化；
- 24h 成交量；
- 历史基准成交量。

### 示例逻辑

```text
if probability_24h_change < negative_threshold
and volume_24h > recent_volume_baseline
then Cooling Down
```

### 前端表达示例

```text
England is cooling down.
Confidence dropped while trading activity stayed elevated.
```

### 数据来源

- Polymarket

---

## 4.3 Volume Spike

### 含义

某支球队相关市场的交易量显著高于近期均值，值得用户关注。

### 所需数据

- 当前 24h 成交量；
- 过去 7d 平均日成交量。

### 示例逻辑

```text
if volume_24h > 2 * average_daily_volume_7d
then Volume Spike
```

### 前端表达示例

```text
Unusual activity around Portugal.
Trading volume spiked well above its recent baseline.
```

### 数据来源

- Polymarket

---

## 4.4 Quiet Accumulation

### 含义

概率没有爆炸式上涨，但在一段时间内持续缓慢抬升，同时交易活跃度也稳定增加。

### 所需数据

- 7d 概率趋势；
- 7d 成交趋势；
- 日级别变化记录；
- 无单日极端尖峰。

### 示例逻辑

```text
if 7d_probability_trend_gradually_up
and 7d_volume_trend_gradually_up
and no_extreme_single_day_spike
then Quiet Accumulation
```

### 前端表达示例

```text
Germany is not exploding, but the market has been steadily leaning in.
```

### 数据来源

- Polymarket
- Snapshot 历史数据

---

## 4.5 Odds Mismatch

### 含义

预测市场价格与传统 bookmaker 赔率隐含概率之间出现明显差异。

### 所需数据

- Polymarket 概率；
- 多家 bookmaker 的冠军赔率；
- 将 odds 转换为 implied probability；
- 多 bookmaker 聚合后的平均值或中位数。

### 计算公式

```text
bookmaker_implied_probability = 1 / decimal_odds
mismatch = polymarket_probability - bookmaker_median_implied_probability
```

### 前端表达示例

```text
Prediction markets are pricing Spain higher than bookmakers.
```

### 数据来源

- Polymarket
- The Odds API

---

## 4.6 News Impact

### 含义

市场出现明显变化时，同期出现相关新闻报道。产品不直接声称因果，而是提供可能相关背景。

### 所需数据

- 球队 24h 概率变化；
- 近期球队 / 球员相关新闻；
- 相关新闻发布时间；
- 相关新闻与球队的匹配关系。

### 前端表达示例

```text
Possible related coverage appeared during the same period as the market move.
Correlation, not causation.
```

### 数据来源

- Polymarket
- GDELT DOC API

---

# 5. 数据源与 API 申请要求

---

## 5.1 Polymarket

### 用途

用于获取：

- 世界杯冠军市场；
- 各球队当前预测市场概率；
- 市场成交量；
- 流动性；
- 市场更新时间；
- 后续配合 snapshot 计算 24h / 7d 变化。

### 是否需要 API Key

**不需要。**

当前阶段只做公开只读数据，不做交易，也不做用户身份认证。

### 当前阶段是否阻塞开发

**不阻塞。**

Sprint 1 可以立即开始。

---

## 5.2 The Odds API

### 用途

用于实现：

- Odds Mismatch Signal；
- 预测市场概率与传统赔率隐含概率对比；
- 后续可扩展 odds ranking / discrepancy feed。

### 是否需要 API Key

**需要。**

请提前申请并在项目环境变量中配置：

```env
THE_ODDS_API_KEY=your_api_key_here
```

### 当前需要申请吗？

**需要尽快申请。**

虽然 Sprint 1 和 Sprint 2 不依赖它，但 Sprint 3 会直接使用。

### 需要用到的 World Cup Winner sport key

```text
soccer_fifa_world_cup_winner
```

### 备注

第一版只需要实时赔率。  
历史 odds 能力未来再考虑，不是当前 MVP 阻塞项。

### Implementation note, 2026-05-13

The first The Odds API provider is now implemented in code.

- Default sport-key discovery checks `/v4/sports?all=true` for an active World Cup outright market.
- If discovery cannot find one, the provider falls back to `soccer_fifa_world_cup_winner`.
- `THE_ODDS_API_WORLD_CUP_SPORT_KEY` can override the key if The Odds API exposes a different current key.
- If there is no API key, no open outright market, or an empty response, the product marks bookmaker odds as missing/empty/unavailable instead of inventing prices.
- Team matching lives in `/src/config/team-name-aliases.ts`.

---

## 5.3 GDELT DOC API

### 用途

用于实现：

- News Impact；
- 球队 / 国家队 / 球员相关新闻抓取；
- Feed 中的相关新闻解释；
- 球队详情页的 Related News。

### 是否需要 API Key

**不需要。**

使用 GDELT 经典公开 DOC API 即可。

### 当前阶段是否阻塞开发

**不阻塞。**

Sprint 4 可以直接实现。

---

## 5.4 NewsAPI

### 是否当前必须接入

**不是。**

### 当前建议

暂不接入 NewsAPI。  
先用 GDELT 完成 News Impact MVP。

### 何时考虑接入 NewsAPI

如果后续发现 GDELT：

- 结果噪音过高；
- 去重复杂；
- 文章质量不稳定；
- 相关新闻召回不理想；

再增加 NewsAPI Provider。

### 如果未来接入，需要环境变量

```env
NEWS_API_KEY=your_api_key_here
```

---

# 6. 总体优先级规划

## P0

1. Sprint 1：Polymarket 真实数据接入
2. Sprint 2：基于 Polymarket 的基础 Market Signals
3. Sprint 3：The Odds API + Odds Mismatch

## P1

4. Sprint 4：GDELT + News Impact

## P2

5. Sprint 5：可选 NewsAPI Provider / LLM 新闻摘要
6. 后续：X API / Reddit / Google Trends / Sentiment Driven / Overheated

---

# 7. 推荐执行顺序

```text
Sprint 1
Polymarket 真实市场数据接入

Sprint 2
Polymarket-only Signals

Sprint 3
The Odds API + Odds Mismatch

Sprint 4
GDELT + News Impact

Sprint 5
可选 NewsAPI / LLM Summary
```

---

# 8. Sprint 1：Polymarket 真实市场数据接入

## 8.1 目标

把当前 World Cup Prediction Terminal 从 Mock Demo 升级为真实 Polymarket 只读数据驱动。

本 Sprint 只做：

- 数据 Provider 架构；
- Polymarket 真实市场接入；
- 现有页面读取真实数据；
- 数据状态、fallback 和更新时间；
- snapshot 机制基础。

本 Sprint 不做：

- The Odds API；
- 新闻数据；
- 复杂 Market Signal；
- 真实交易；
- 钱包；
- 登录系统。

---

## 8.2 需要实现的内容

### 8.2.1 梳理当前数据流

识别当前项目中所有直接依赖 mock market data 的位置，包括但不限于：

- Home Heatmap；
- Market Page；
- Team Detail Page；
- Feed；
- Signal Panel；
- Mock Bid 相关展示。

---

### 8.2.2 创建 Market Data Provider 架构

建议接口：

```ts
interface MarketDataProvider {
  getWorldCupWinnerMarketData(): Promise<NormalizedWorldCupMarketData>;
}
```

并实现：

```ts
MockMarketDataProvider
PolymarketMarketDataProvider
```

---

### 8.2.3 统一内部数据模型

建议：

```ts
type MarketDataStatus =
  | "live"
  | "cached"
  | "fallback_mock"
  | "error";

interface NormalizedTeamMarketData {
  teamId: string;
  teamName: string;
  marketOutcomeName: string;
  currentProbability: number;
  volume?: number;
  liquidity?: number;
  source: "polymarket" | "mock";
  sourceMarketId?: string;
  lastUpdated: string;
}

interface NormalizedWorldCupMarketData {
  status: MarketDataStatus;
  source: "polymarket" | "mock";
  eventTitle?: string;
  marketTitle?: string;
  marketId?: string;
  teams: NormalizedTeamMarketData[];
  lastUpdated: string;
  errorMessage?: string;
}
```

---

### 8.2.4 拉取 Polymarket 数据

目标：

- 找到 2026 FIFA World Cup Winner 对应市场；
- 获取所有 outcome / team；
- 将市场 price 规范化为 probability；
- 获取 volume / liquidity；
- 获取更新时间。

注意：

- 不要将 Polymarket 原始字段直接传入 UI；
- UI 只消费内部 normalized model；
- 后续 provider 替换时 UI 不应改动。

---

### 8.2.5 Fallback 机制

如果 Polymarket 拉取失败：

- 自动 fallback 到现有 mock data；
- 页面仍能渲染；
- UI 明确显示：
  - `Fallback mock data`
  - 或类似状态标记。

---

### 8.2.6 数据状态展示

在以下页面显示数据来源和更新时间：

- 首页；
- Market Page；
- Team Detail Page。

建议 UI 文案：

```text
Live market data · Updated 3 min ago
```

或：

```text
Fallback mock data · Live source unavailable
```

---

### 8.2.7 Snapshot 机制基础

为后续 24h / 7d Signal 做准备，需要引入 snapshot 机制。

建议抽象：

```ts
interface MarketSnapshotRepository {
  saveSnapshot(snapshot: MarketSnapshot): Promise<void>;
  getSnapshots(teamId: string, range: SnapshotRange): Promise<MarketSnapshot[]>;
}
```

第一版只要求：

- 能存当前 snapshot；
- 数据结构设计合理；
- 为 Sprint 2 的历史变化计算做准备。

---

## 8.3 直接交给 Codex 的任务指令

```text
请进入下一阶段：Sprint 1 - Polymarket 真实市场数据接入。

目标：
把当前 World Cup Prediction Terminal 从 mock data demo 升级为真实 Polymarket 只读数据驱动。

本阶段只做 Polymarket 数据层和现有页面的真实数据替换，不接赔率，不接新闻，不新增复杂页面。

需要完成：

1. 梳理当前 mock market data 的使用位置
2. 创建 data provider 架构
   - MarketDataProvider interface
   - MockMarketDataProvider
   - PolymarketMarketDataProvider

3. 使用 Polymarket 公共只读接口获取：
   - 2026 FIFA World Cup Winner market
   - 每个 outcome / team 的当前价格
   - 市场 volume / liquidity，如果可获取
   - market updated time

4. 统一输出内部 normalized model：
   - teamId
   - teamName
   - currentProbability
   - volume
   - liquidity
   - source
   - sourceMarketId
   - lastUpdated

5. 增加 snapshot 机制：
   - 第一版可用本地 JSON 或当前项目已有的轻量持久化方式
   - 为后续计算 24h / 7d change 做准备
   - 如果项目已有服务端能力，可设计为 repository interface

6. 页面改造：
   - 首页热力图改为读取统一 provider 数据
   - Team Detail Page 改为读取统一 provider 数据
   - Market Page 如果当前已存在，也改为读取统一 provider 数据
   - 增加 loading / error / fallback mock 状态
   - 显示数据来源和 last updated

7. 若 Polymarket 拉取失败：
   - 自动 fallback 到现有 mock data
   - UI 显示 fallback/mock 状态

8. 不要实现真实交易
9. 不要接钱包
10. 不要接第三方赔率和新闻 API

完成后输出：
1. 修改文件列表
2. 新的数据流说明
3. 如何运行
4. 如何验证真实 Polymarket 数据是否生效
5. 下一阶段建议
```

---

# 9. Sprint 2：基于 Polymarket 的基础 Market Signals

## 9.1 目标

基于 Polymarket 真实数据与 snapshot 历史，生成第一批无需第三方数据的 Market Signals：

1. Heating Up
2. Cooling Down
3. Volume Spike
4. Quiet Accumulation

---

## 9.2 扩展字段

需要补充：

- currentProbability；
- probability24hAgo；
- probability7dAgo；
- change24h；
- change7d；
- currentVolume；
- volume24h；
- averageDailyVolume7d。

---

## 9.3 Signal 统一模型

建议：

```ts
type MarketSignalType =
  | "heating_up"
  | "cooling_down"
  | "volume_spike"
  | "quiet_accumulation";

interface MarketSignal {
  id: string;
  type: MarketSignalType;
  teamId: string;
  title: string;
  oneLineSummary: string;
  explanation: string;
  severity: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  dataPoints: Record<string, number | string>;
  generatedAt: string;
  status?: "active" | "data_insufficient";
}
```

---

## 9.4 历史数据不足时的处理

如果 snapshot 历史不足：

- 不允许硬算；
- 返回 `data_insufficient`；
- UI 显示：

```text
Accumulating market history
```

---

## 9.5 直接交给 Codex 的任务指令

```text
请进入 Sprint 2：基于 Polymarket 数据构建第一批 Market Signals。

本阶段只实现以下 4 类 Signal：
1. heating_up
2. cooling_down
3. volume_spike
4. quiet_accumulation

数据来源：
仅使用现有 Polymarket provider + snapshot 数据。
不要接赔率 API。
不要接新闻 API。

任务：

1. 扩展 normalized market data：
   - currentProbability
   - probability24hAgo
   - probability7dAgo
   - change24h
   - change7d
   - currentVolume
   - volume24h
   - averageDailyVolume7d

2. 实现 signal generation：
   - Heating Up:
     probability24h change > threshold
     and volume24h > recent baseline

   - Cooling Down:
     probability24h change < negative threshold
     and volume24h > recent baseline

   - Volume Spike:
     volume24h > 2x recent average volume

   - Quiet Accumulation:
     7d probability trend gradually up
     and volume trend gradually up
     and no single extreme one-day spike

3. 每个 signal 输出：
   - type
   - teamId
   - title
   - oneLineSummary
   - explanation
   - severity
   - confidence
   - dataPoints
   - generatedAt

4. UI 改造：
   - 首页 Market Signals Panel 展示真实 signals
   - Feed 页面接入这些 signal
   - Team Detail Page 显示该球队相关 signal

5. 如果历史 snapshot 不足：
   - 不要硬算
   - 返回 data_insufficient 状态
   - UI 显示 “Accumulating market history”

6. 不要做投资建议表达

完成后输出：
- 信号阈值设计
- 哪些信号已可用
- 哪些因历史不足暂不可用
- 下一阶段建议
```

---

# 10. Sprint 3：The Odds API + Odds Mismatch Signal

## 10.1 目标

接入 The Odds API，生成 Odds Mismatch Signal。

### 核心对比

- Polymarket probability；
- Bookmaker implied probability。

---

## 10.2 环境变量

需要提前配置：

```env
THE_ODDS_API_KEY=your_api_key_here
```

---

## 10.3 Sport Key

```text
soccer_fifa_world_cup_winner
```

---

## 10.4 Odds Provider 架构

```ts
interface OddsProvider {
  getWorldCupWinnerOdds(): Promise<NormalizedWorldCupOdds>;
}
```

实现：

```ts
TheOddsApiProvider
```

---

## 10.5 Odds 数据统一模型

```ts
interface NormalizedBookmakerOdds {
  bookmaker: string;
  teamId: string;
  decimalOdds: number;
  impliedProbability: number;
  lastUpdated?: string;
}

interface NormalizedTeamOddsSummary {
  teamId: string;
  bookmakerCount: number;
  averageImpliedProbability: number;
  medianImpliedProbability: number;
  minImpliedProbability: number;
  maxImpliedProbability: number;
}
```

---

## 10.6 Team Name Normalization

必须创建独立映射文件，不要把映射写死在 provider 逻辑里。

建议文件：

```text
/src/config/team-name-aliases.ts
```

示例：

```text
USA -> United States
South Korea -> Korea Republic
```

---

## 10.7 Odds Mismatch 定义

```text
mismatch = polymarket_probability - bookmaker_median_implied_probability
```

---

## 10.8 UI 改造

需要新增：

- Market Page：
  - Odds Mismatch 排序；
- Team Detail Page：
  - Odds Comparison Card；
- Feed Page：
  - Odds Mismatch Item；
- Home Market Signals：
  - Odds Mismatch Highlight。

---

## 10.9 缺失 Key / API 失败处理

必须支持：

- Missing API key；
- API request failed；
- No odds available；
- Team mapping unmatched。

UI 不应崩溃，相关模块可降级隐藏或显示友好提示。

---

## 10.10 直接交给 Codex 的任务指令

```text
请进入 Sprint 3：接入 The Odds API，构建 Odds Mismatch Signal。

前提：
环境变量中会提供：
THE_ODDS_API_KEY

本阶段目标：
对比 Polymarket 的球队夺冠概率与 The Odds API 提供的 FIFA World Cup Winner outright odds，并生成 Odds Mismatch signals。

官方 sport key：
soccer_fifa_world_cup_winner

任务：

1. 创建 OddsProvider interface
2. 实现 TheOddsApiProvider
3. 通过环境变量读取 THE_ODDS_API_KEY
4. 获取 FIFA World Cup Winner outrights/futures odds
5. 将 decimal odds / american odds 统一转换为 implied probability
6. 对多个 bookmaker：
   - 计算 average implied probability
   - 计算 median implied probability
   - 保留 bookmaker count
   - 记录 max / min bookmaker implied probability

7. 建立 team name normalization：
   - Brazil vs Brazil
   - USA vs United States
   - South Korea vs Korea Republic
   - 处理不同数据源球队名差异
   - 需要独立 mapping 文件，不要把映射硬编码在逻辑里

8. 生成 Odds Mismatch Signal：
   mismatch = Polymarket probability - bookmaker median implied probability

9. UI 展示：
   - Market Page 增加 Odds Mismatch 排序
   - Team Detail Page 增加 odds comparison card
   - Feed Page 增加 odds mismatch items
   - 首页 Market Signals 增加 Odds Mismatch

10. 增加状态处理：
   - Missing API key
   - API request failed
   - No odds available
   - Team mapping unmatched

11. 不要影响现有 Polymarket signals

完成后输出：
- 数据结构
- 球队 mapping 策略
- API key 未配置时页面表现
- 如何测试
```

---

# 11. Sprint 4：GDELT + News Impact Signal

## 11.1 目标

使用 GDELT DOC API，基于近期相关新闻，为市场波动提供“可能相关的新闻背景”。

---

## 11.2 当前阶段不做什么

不做：

- NewsAPI；
- LLM 自动新闻摘要；
- 社媒情绪；
- 新闻因果归因。

只做：

- 新闻检索；
- 与球队关联；
- 与近期市场变动组合展示；
- 表达为 `possible related coverage`。

---

## 11.3 News Provider 架构

```ts
interface NewsProvider {
  searchRecentTeamNews(query: TeamNewsQuery): Promise<NewsArticle[]>;
}
```

实现：

```ts
GdeltNewsProvider
```

---

## 11.4 NewsArticle 统一模型

```ts
interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
  language?: string;
  matchedTeamIds: string[];
  matchedKeywords: string[];
  snippet?: string;
}
```

---

## 11.5 Team News Query Config

建议建立配置文件：

```text
/src/config/team-news-query-config.ts
```

每支球队维护：

- team aliases；
- country aliases；
- key players；
- optional exclude terms。

---

## 11.6 News Impact 初版逻辑

当某球队：

- 24h probability change 超过阈值；
- 或被标记为 Heating Up / Cooling Down；

则检索该球队最近 24h / 48h 的相关新闻。

Signal 输出建议：

```ts
type NewsImpactConfidence = "low" | "medium";

interface NewsImpactSignal {
  type: "news_impact";
  teamId: string;
  marketMove: number;
  relatedArticles: NewsArticle[];
  oneLineSummary: string;
  explanation: string;
  confidence: NewsImpactConfidence;
  disclaimer: "Correlation, not causation.";
}
```

---

## 11.7 文案要求

禁止写：

```text
This news caused the market move.
```

应写：

```text
Possible related coverage appeared during the same period as the market move.
```

或：

```text
The market moved higher while recent coverage around the team intensified.
```

---

## 11.8 直接交给 Codex 的任务指令

```text
请进入 Sprint 4：接入 GDELT DOC API，构建 News Impact Signal。

本阶段使用 GDELT 经典公开 DOC API，不需要 API Key。
不要接 NewsAPI。
不要接社媒 API。

目标：
当球队概率发生明显变化时，抓取相关球队/球员新闻，并生成“可能相关的新闻影响”解释。

任务：

1. 创建 NewsProvider interface
2. 实现 GdeltNewsProvider
3. 支持按关键词查询：
   - team name
   - country name
   - key players if available in config
   - World Cup context keywords

4. 创建 news query config：
   - 每支球队可维护 aliases
   - 可配置关键球员名
   - 可配置排除词，减少误匹配

5. 统一输出 NewsArticle model：
   - id
   - title
   - url
   - source
   - publishedAt
   - language
   - matchedTeamIds
   - matchedKeywords
   - snippet or summary if available

6. 建立 News Impact 初版逻辑：
   - 当某球队 24h probability change 超过阈值
   - 或已被判定为 Heating Up / Cooling Down
   - 检索其最近 24h / 48h 相关新闻
   - 返回 candidate related news
   - 不直接宣称因果关系
   - 表达为 “possible related coverage”

7. Signal 输出：
   - type: news_impact
   - teamId
   - marketMove
   - relatedArticles
   - oneLineSummary
   - explanation
   - confidence: low / medium
   - disclaimer: correlation, not causation

8. UI：
   - Team Detail Page 显示 Recent Related News
   - Feed Page 增加 News Impact items
   - Market Signals 中可出现 News Impact

9. 增加降级逻辑：
   - GDELT 请求失败
   - 没有相关新闻
   - 新闻结果过多或质量差时截断并去重

10. 不要引入 NewsAPI
11. 不要引入 LLM 总结，第一版先做纯结构化接入

完成后输出：
- 新闻查询策略
- News Impact 的可信度限制
- 可能存在的误匹配问题
- 下一阶段是否建议加入 NewsAPI 或 LLM summary
```

---

# 12. Sprint 5：可选增强，不作为当前必做

## 12.1 可选 NewsAPI Provider

当 GDELT 质量不足时，再新增：

- `NewsApiProvider`
- `NewsProviderAggregator`
- 支持：
  - `gdelt_only`
  - `newsapi_only`
  - `hybrid`

如果做 NewsAPI，需要环境变量：

```env
NEWS_API_KEY=your_api_key_here
```

---

## 12.2 可选 LLM 新闻摘要

后续可引入 LLM 完成：

- 多篇新闻聚合；
- 提炼 1 句 market context；
- 标注利好 / 利空 / 不确定；
- 避免单纯标题堆叠。

但此能力当前不是 P0。

---

# 13. 当前阶段暂不做的方向

以下方向暂缓：

1. X API 舆情；
2. Reddit 热度；
3. Google Trends；
4. Sentiment Driven Signal；
5. Overheated Signal；
6. 真实交易；
7. 钱包；
8. 用户账户系统；
9. 下注执行；
10. 复杂后端管理系统。

---

# 14. 给 Codex 的全局执行约束

每个 Sprint 都必须遵守：

1. 不要提前实现后续 Sprint；
2. 不要重构无关文件；
3. 不要破坏现有 UI；
4. 不要删除 mock fallback；
5. 新增 provider 时必须做接口抽象；
6. UI 只能消费 normalized model；
7. 所有第三方数据都必须支持 error / unavailable / fallback；
8. 不允许出现真实交易逻辑；
9. 不允许引入钱包；
10. 不允许出现“稳赚”“必买”“投资建议”式文案；
11. 每次任务开始前，先阅读：
    - `AGENTS.md`
    - `/design-reference/UI_STYLE_GUIDE.md`
    - 本文档；
12. 涉及 UI 更新时，继续参考 `/design-reference/` 目录下的现有视觉参考图。

---

# 15. 每个 Sprint 完成后的统一交付格式

每完成一个 Sprint，Codex 必须输出：

1. 本次修改文件列表；
2. 新增数据结构；
3. 新的数据流；
4. 如何运行；
5. 如何测试；
6. 当前已完成能力；
7. 当前未完成能力；
8. 已知限制；
9. 下一 Sprint 建议。

---

# 16. 当前你需要提前准备的事项

## 必须准备

### The Odds API Key

用于 Sprint 3。

请申请并配置：

```env
THE_ODDS_API_KEY=你的key
```

---

## 暂时不需要准备

### Polymarket API Key

不需要。

### GDELT API Key

不需要。

### NewsAPI Key

当前不需要。

---

# 17. 最终执行建议

现在建议立刻执行：

```text
Sprint 1：Polymarket 真实市场数据接入
```

你可以将本文档直接交给 Codex，并输入：

```text
请先阅读 /docs/WORLD_CUP_DATA_SIGNAL_ROADMAP.md。
然后严格按照文档执行 Sprint 1。
不要提前实现 Sprint 2 及后续内容。
完成后按照文档规定的交付格式输出结果。
```
