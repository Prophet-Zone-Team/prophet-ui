# World Cup Prediction Terminal — 用户流程需求文档

> 基于当前代码分析（2026-05-17），梳理用户从进入首页到完成 bid 的完整 flow，标注当前缺失项。

---

## 一、用户核心流程图

```
                        ┌──────────────────────────────┐
                        │     用户进入首页 (/)           │
                        │   ① 浏览市场基本面             │
                        └──────┬───────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
   ┌──────────────┐    ┌──────────────┐     ┌──────────────┐
   │ 看球队列表    │    │ 看 Heatmap   │     │ 看信号/排名   │
   │ (48 teams)   │    │ (概率密度)   │     │ (Top/Bottom) │
   └──────┬───────┘    └──────┬───────┘     └──────┬───────┘
          │                   │                     │
          └───────────────────┼─────────────────────┘
                              │ ② 点击某支球队
                              ▼
                    ┌──────────────────────────────┐
                    │      球队详情页 (/team/[slug]) │
                    │   ③ 深度分析 + 决策           │
                    └──────┬───────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │直接 Bid   │   │加 Watchlist│  │分享/返回  │
     │      │   │          │   │          │
     └──────┬───┘   └──────────┘   └──────────┘

```

---

## 二、首页（/）- 市场基本面数据

### 2.1 当前状态

| 模块 | 当前数据 | 数据来源 | 是否真实 |
|------|---------|---------|---------|
| **TerminalTopbar** | 48 / 48 tracked markets, Total Volume, 24h move leader | Polymarket Gamma API | ✅ 真实（Polymarket 源） |
| **MarketCoverageStrip** | Provider markets count, mapped teams, 24h volume, liquidity | 同上 | ✅ 真实 |
| **Hero - Market Leader** | 最高概率球队 + 概率值 | 同上 | ✅ 真实 |
| **Hero - Total Volume** | 总交易量（所有 team volume 之和） | 同上 | ✅ 真实 |
| **Hero - Hot Signal** | 复合热力分（60% volume 权重 + 25% 概率 + 15% momentum） | 前端计算 | ⚠️ 公式合理但用户不可理解 |
| **Market Heatmap** | 48 支球队卡片网格（按概率排序），每卡片显示概率/7d/Volume/Sentiment | 同上 | ✅ 数据真实 |
| **Heatmap 密度条** | 24 条正弦波 + 概率×3.6 + volume/620K | **纯装饰** | ❌ 非真实数据 |
| **Top Movers** | 4 支 24h 上涨最多的球队 | 前端排序 | ✅ 真实 |
| **Biggest Losers** | 4 支 24h 下跌最多的球队 | 前端排序 | ✅ 真实 |
| **MarketSignals** | 最多 6 条信号（volume_spike / heating_up / cooling_down 等） | 前端从 snapshot 计算 | ⚠️ 数据真实但阈值/命名不可理解 |

### 2.2 用户疑问 & 缺失

| 用户问题 | 当前状态 | 应做改进 |
|---------|---------|---------|
| **"Hot signal 表达什么意思？"** | 复合热力分（volume×0.55 + probability×1.2 + momentum×7 + sentiment），没有任何解释 | ① 改名或直接去掉，用"Market Leader（最高概率）"+"Volume Leader（最高交易量）"两个明确指标替代 ② 或保留但增加 tooltip 解释公式 |
| **"Market Heatmap 折线图展示的数据是什么？"** | 底部密度条是**纯装饰**（sin + probability + volume），不是折线图 | ① 底部密度条改为**真实概率走势 mini chart**（sparkline，取最近 7 天或 30 天的概率点） ② 或者去掉密度条，只保留颜色强度（概率越高越亮） |
| **"volume spike 表达什么意思？"** | 当前逻辑：某队 Volume ≥ 最大 Volume × 72% 或 ≥ 中位数 × 1.8 时触发。标题："X is crowding the volume board" | ① 改为更易懂的表述，如"交易量异常活跃" ② 明确标注参考基准（"该队交易量达到全场中位数的 1.8 倍"） ③ 阈值可调 |
| **Heatmap 强度计算** | `probability × 4.8 + volume / 480000`（硬编码系数） | ① 改为基于概率百分位的归一化（0-100%） ② 颜色梯度区分更明确（高概率=绿色/暖色，低概率=灰色/冷色） |
| **整体信息过载** | 首页 10 个 section（Topbar + Banner + Coverage + Disclosure + Hero + Heatmap + TopMovers + Losers + Signals + Footer） | 精简为 5-6 个核心 section，弱化 DataStatus/Coverage/Disclosure 到 footer |

### 2.3 首页需求清单

| 编号 | 需求 | 优先级 |
|------|------|--------|
| **H1** | 修复 Heatmap 底部密度条：改为真实 7d/30d 概率 sparkline（mini line chart），或直接去掉 | 🔴 高 |
| **H2** | 重新定义或解释 "Hot Signal"：提供明确的指标标签和含义说明 | 🔴 高 |
| **H3** | 重新定义 "volume spike" 信号：用通俗语言解释，标注参考基准数值 | 🟡 中 |
| **H4** | 每支球队的列表/卡片上增加 **Quick Bid 按钮**（直接跳转 bid 页并预选该球队） | 🔴 高 |
| **H5** | 精简首屏信息层级：Hero → Heatmap → Top/Bottom Movers → 快速入口（不要 Signal Tape 占大块） | 🟡 中 |
| **H6** | Heatmap 颜色强度归一化：改为基于概率百分位 + 涨跌方向的统一色阶 | 🟡 中 |
| **H7** | 增加数据刷新倒计时 / 最后更新时间（用户在首屏能看到数据新鲜度） | 🟢 低 |

---

## 三、球队详情页（/team/[slug]）- 决策辅助数据

### 3.1 当前状态

| 模块 | 当前数据 | 数据来源 | 是否完整 |
|------|---------|---------|---------|
| **TeamHeader** | 队名、代码、区域、概率、24h move、Volume | Polymarket | ✅ |
| **ProbabilityChart** | 30 天概率面积图 | 本地 DB（market-history） | ✅ |
| **MarketStats** | 队名、概率、24h/7d change、Volume、Sentiment | Polymarket | ✅ |
| **OddsVsMarket** | 市场概率 vs 庄家赔率对比柱状图 | The Odds API | ✅（有时不可用） |
| **RelatedNews** | GDELT 新闻（标题、来源、影响分、摘要、关键词） | GDELT API | ⚠️ 未按时间排序 |
| **FootballContextPanel** | Team profile（logo/国家/成立年/球场）、Fixtures（最多 3 场）、Squad（最多 6 人/姓名/位置/年龄）、Injuries（最多 4 人）、Standings（最多 2 行）、Odds（最多 4 行） | API-Football | ⚠️ 数据偏少 |
| **TradeTicketPanel** | 概率 + CLOB token 状态 + "Open trade ticket" 链接 | 同 MarketStats | ✅ |
| **WatchlistButton** | 添加/移除本地关注列表 | localStorage | ✅ |

### 3.2 用户需求 & 缺失

| 用户需求 | 当前状态 | 缺失内容 |
|---------|---------|---------|
| **"国际排名"** | `Team` 类型有 `fifaRank?: number` 字段，但 `worldCupTeams.ts` 里所有球队均未填写，UI 也未渲染 | ① 补全 48 支球队的 FIFA 排名数据 ② 在 TeamHeader 或 MarketStats 中展示 |
| **"最近一个月的新闻，按时间倒序"** | 有 GDELT 新闻但 **未排序**（按 GDELT 返回顺序展示），只显示标题+摘要+影响分 | ① 按 `publishedAt` 降序排列 ② 增加新闻时间分组（今天/本周/本月） ③ 显示具体发布时间（当前只显示日期） |
| **"球员数据、阵容数据"** | 只展示最多 6 名球员（姓名/位置/年龄），来自 API-Football 缓存 | ① 扩展 Squad 到**完整大名单**（23-26 人） ② 增加球员详细数据：出场次数、进球、助攻、国家队出场、俱乐部 ③ 增加**首发预测 / 常用阵型** |
| **"FIFA官方数据"** | 目前只有最基本的 standings + fixtures | ① **FIFA 排名** - 当前排名 + 历史排名走势 ② **近期赛果** - 最近 5-10 场比赛（胜负平、比分） ③ **历史交锋记录（H2H）** - 对阵其他强队的历史战绩 ④ **核心球员（Key Players）** - 标星球员 + 身价 ⑤ **球队状态（Form）** - 最近 N 场比赛的胜负走势图 ⑥ **小组信息（Group）** - 同组对手 + 出线概率 ⑦ **教练信息** - 主教练姓名、执教战绩 |

### 3.3 球队详情页需求清单

| 编号 | 需求 | 优先级 |
|------|------|--------|
| **T1** | 补全 48 支球队 FIFA 排名，在 TeamHeader 显著展示 | 🔴 高 |
| **T2** | 新闻列表按 `publishedAt` 降序排列，增加时间分组 | 🔴 高 |
| **T3** | 扩展球员数据：完整大名单（23-26 人）+ 出场/进球/助攻/国家队出场/俱乐部 | 🔴 高 |
| **T4** | 增加球队近期赛果（最近 5-10 场） | 🟡 中 |
| **T5** | 增加 FIFA 排名历史走势图 | 🟡 中 |
| **T6** | 增加核心球员（Key Players / 明星球员标记） | 🟡 中 |
| **T7** | 增加历史交锋记录（H2H vs 强队） | 🟢 低 |
| **T8** | 增加球队状态 Form 走势图（WWDLW 型） | 🟢 低 |
| **T9** | 增加小组信息 + 同组对手 + 出线概率 | 🟢 低 |
| **T10** | 增加主教练信息 | 🟢 低 |
| **T11** | 增加 **Quick Bid 按钮**（跳转 bid 页并预选球队） | 🔴 高 |

---

## 四、Bid 页面（/bid）- 下单流程

### 4.1 当前状态

- 独立页面 `/bid`，不接受 team 参数
- 用户进入后需从 `<select>` 下拉框重新选择球队
- 完整下单流程需要：Connect 钱包 → Enable → Derive Credentials → Deposit → Approve → Place Order
- 每次重连都需要全套流程（已在上一轮修复中优化）
- 无"快速下单"概念

### 4.2 用户需求 & 缺失

| 用户需求 | 当前状态 | 缺失内容 |
|---------|---------|---------|
| **"在列表 item 加 quick bid 按钮"** | HeatmapCell 和 TeamMarketCard 只链接到 `/team/[slug]`，没有任何 bid 入口 | ① 每个 HeatmapCell 增加 **Quick Bid** 按钮（小图标/文字链接） ② 点击后跳转 `/bid?team=slug&side=yes&trade=buy` |
| **"不需要把 bid 放到第三层"** | 当前路径：首页 → 球队详情 → Bid 页（需重选队），3 层 | ① 首页直接可进入 Bid（Quick Bid on card） ② 球队详情页直接 Bid（Quick Bid button） ③ Bid 页接收 team 参数并自动预选 |
| **"bid 页接受 team 参数"** | BidPage 不支持 URL 参数，用 `snapshots[0]` 作为默认 | ① BidPage 读取 `searchParams.team`，匹配到对应 snapshot 后自动选中 ② 同时预填默认 outcome=YES, trade=buy |

### 4.3 Bid 页面需求清单

| 编号 | 需求 | 优先级 |
|------|------|--------|
| **B1** | Bid 页面接收 `?team=slug` 参数，自动预选球队 | 🔴 高 |
| **B2** | Heatmap 卡片增加 **Quick Bid** 按钮（小尺寸，不破坏卡片布局） | 🔴 高 |
| **B3** | TeamMarketCard（Top Movers / Biggest Losers）增加 **Quick Bid** 按钮 | 🔴 高 |
| **B4** | 球队详情页 TradeTicketPanel 改为 **"Bid YES" / "Bid NO"** 两个按钮，直接跳转 bid 页并预填 | 🔴 高 |
| **B5** | 所有 Quick Bid 入口默认预填 outcome=YES, trade=buy（可后续调整） | 🟡 中 |

---

## 五、数据真实性 & 可信度

### 5.1 数据源真实性一览

| 数据类型 | 来源 | 是否真实 | 备注 |
|---------|------|---------|------|
| **概率 / Volume / 变化** | Polymarket Gamma API | ✅ 实时 | 取决于 API key 配置 |
| **CLOB 费用 / Token** | Polymarket CLOB API | ✅ 实时 | 同上 |
| **历史概率** | 本地 D1 数据库（market-history） | ✅ 历史快照 | 每 10 分钟 cron 采集 |
| **庄家赔率** | The Odds API | ✅ 实时 | 需要 API key |
| **新闻** | GDELT API | ✅ 实时 | 影响分是前端计算的 |
| **球队资料 / 赛程 / 阵容** | API-Football | ✅ 实时 | 需要 API key，部分数据有缓存 |
| **信号（Signals）** | 前端纯计算 | ✅（基于真实数据） | 阈值和公式需验证合理性 |
| **Heatmap 密度条** | 前端纯装饰 | ❌ 假数据 | 必须修复 |
| **Hot Score** | 前端纯计算 | ⚠️ 半真（基于真实数据但公式武断） | 需增加解释或替换 |

### 5.2 当前渲染假数据/装饰数据的部分

| 位置 | 内容 | 是否真实 | 修复方案 |
|------|------|---------|---------|
| `HomePage.tsx:314-323` | `getDensityBars()` - Heatmap 底部装饰条 | ❌ 纯装饰（sin 波） | 改为 sparkline 或去掉 |
| `HomePage.tsx:269` | Heatmap 背景强度 `probability*4.8 + volume/480000` | ⚠️ 硬编码系数 | 改为百分位归一化 |
| `analyzer.ts:69-83` | Hot Score 计算 | ⚠️ 主观公式 | 增加解释或替换为明确指标 |

---

## 六、总需求优先级矩阵

```
        高优先级 ─────────────────────────────────────
        │  H1  Heatmap 密度条改真实 sparkline
        │  H2  解释/替换 Hot Signal
        │  H4  首页卡片加 Quick Bid
        │  T1  补全 FIFA 排名
        │  T3  扩展球员数据
        │  T11 详情页加 Quick Bid
        │  B1  Bid 页接收 team 参数
        │  B2  Heatmap 卡片加 Quick Bid
        │  B3  Movers/Losers 卡片加 Quick Bid
        │  B4  详情页改 Bid YES/NO 按钮
        │
        中优先级 ─────────────────────────────────────
        │  H3  重新定义 volume spike 信号
        │  H5  精简首屏信息层级
        │  H6  Heatmap 颜色归一化
        │  T2  新闻按时间排序
        │  T4  近期赛果
        │  T5  FIFA 排名走势图
        │  T6  核心球员标记
        │  B5  Quick Bid 默认参数
        │
        低优先级 ─────────────────────────────────────
        │  H7  数据刷新倒计时
        │  T7  H2H 交锋记录
        │  T8  Form 走势图
        │  T9  小组信息 + 出线概率
        │  T10 主教练信息
```

---

## 七、不在此范围的确认

以下内容**不**在当前需求范围内（非功能或已有其他计划）：

- 后端 API 的数据采集频率调整（cron trigger）
- 钱包连接 / 签名流程（已在上一轮修复）
- Polymarket 地理封锁判断（已在上一轮修复）
- 移动端适配（已有基础适配，非本次重点）
- 交易安全审计（已有 check-trading-safety 脚本）
