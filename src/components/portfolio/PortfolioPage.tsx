"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MarketDataMeta } from "../../data/providers/types";
import type {
  TeamMarketSnapshot,
  TradingUserSession,
  UserOrderRecord,
  UserPositionRecord,
  UserTradingReadiness,
} from "../../types/market";
import { formatPriceCents, formatShareSize } from "../../lib/market/orderMath";
import {
  connectTradingWallet,
  formatShortWalletAddress,
  loadTradingSession,
} from "../trading/tradingWalletSession";
import { PlaceBidButton } from "../trading/PlaceBidButton";
import { WalletMenuButton } from "../trading/WalletMenuButton";
import { TeamFlag } from "../teams/TeamFlag";
import { formatChange, formatProbability, formatVolume } from "../home/market-formatters";

interface PortfolioPageProps {
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

interface UserOpenOrder {
  id: string;
  status: string;
  market: string;
  asset_id: string;
  side: string;
  price: string;
  original_size: string;
  size_matched: string;
  outcome: string;
  created_at: number;
  order_type: string;
}

interface PortfolioSeriesPoint {
  date: string;
  value: number;
}

interface PortfolioSignal {
  id: string;
  title: string;
  detail: string;
  value: string;
  tone: "up" | "down" | "neutral";
  team?: TeamMarketSnapshot;
}

interface RiskWatchItem {
  id: string;
  title: string;
  detail: string;
  exposure: string;
  impact: "Low" | "Medium" | "High";
  tone: "up" | "down" | "neutral";
}

type LoadStatus = "idle" | "loading" | "ready" | "error";

const DONUT_COLORS = ["#125afc", "#20c2e4", "#16a67c", "#e7ba35", "#d9485f"];

export function PortfolioPage({ snapshots, dataStatus }: PortfolioPageProps) {
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [readiness, setReadiness] = useState<UserTradingReadiness | undefined>();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [openOrders, setOpenOrders] = useState<UserOpenOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<UserOrderRecord[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [amount, setAmount] = useState("100");

  const loadPortfolio = useCallback(async () => {
    setStatus("loading");
    setMessage(undefined);

    try {
      const tradingSession = await loadTradingSession();
      setSession(tradingSession);

      if (!tradingSession) {
        setPositions([]);
        setOpenOrders([]);
        setOrderHistory([]);
        setReadiness(undefined);
        setStatus("ready");
        return;
      }

      const [positionsResult, openOrdersResult, historyResult, readinessResult] = await Promise.all([
        fetchJson<{ positions?: UserPositionRecord[]; error?: string }>("/api/trading/positions?limit=100"),
        fetchJson<{ orders?: UserOpenOrder[]; history?: UserOrderRecord[]; error?: string }>("/api/trading/orders/open"),
        fetchJson<{ orders?: UserOrderRecord[]; error?: string }>("/api/trading/orders/history?limit=40"),
        fetchJson<UserTradingReadiness>("/api/trading/readiness"),
      ]);

      setPositions(positionsResult.data?.positions ?? []);
      setOpenOrders(openOrdersResult.data?.orders ?? []);
      setOrderHistory(historyResult.data?.orders ?? openOrdersResult.data?.history ?? []);
      setReadiness(readinessResult.data);

      const nonBlockingErrors = [positionsResult.error, openOrdersResult.error, historyResult.error, readinessResult.error]
        .filter(Boolean)
        .join(" ");
      setMessage(nonBlockingErrors || undefined);
      setStatus(nonBlockingErrors && !positionsResult.data ? "error" : "ready");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  async function connectWallet() {
    setStatus("loading");
    setMessage(undefined);

    try {
      setSession(await connectTradingWallet());
      await loadPortfolio();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  const portfolio = useMemo(
    () => buildPortfolioView({ positions, openOrders, orderHistory, snapshots, readiness }),
    [openOrders, orderHistory, positions, readiness, snapshots],
  );
  const selectedSnapshot = portfolio.primaryTeam ?? snapshots[0];
  const numericAmount = Number(amount);
  const referencePrice = selectedSnapshot ? Math.max(0.01, selectedSnapshot.market.probability / 100) : 0;
  const estimatedShares = Number.isFinite(numericAmount) && referencePrice > 0 ? numericAmount / referencePrice : 0;

  return (
    <main className="prophet-html">
      <div className="page portfolio-page">
        <PortfolioTopbar />

        <section className="portfolio-hero" aria-labelledby="portfolio-title">
          <div>
            <span className="eyebrow">Portfolio</span>
            <h1 id="portfolio-title">Portfolio</h1>
            <p>Track your World Cup market exposure, PnL, positions, and order activity from the connected account.</p>
            <div className="portfolio-actions">
              <PlaceBidButton className="bid-button" teamName={selectedSnapshot?.team.name}>
                Place Bid
                <ArrowIcon />
              </PlaceBidButton>
              <a className="market-detail-button" href="#open-positions">
                Manage Positions
              </a>
            </div>
          </div>

          <div className="portfolio-account-panel">
            <PortfolioAccountMetric label="Wallet" value={session ? formatShortWalletAddress(session.walletAddress) : "Not connected"} />
            <PortfolioAccountMetric label="USDC" value={readiness?.balances?.usdcAvailable !== undefined ? formatMoney(readiness.balances.usdcAvailable) : "Pending"} />
            <PortfolioAccountMetric label="Status" value={getAccountStatusCopy(session, readiness, status)} />
            {!session ? (
              <button type="button" onClick={connectWallet} disabled={status === "loading"}>
                {status === "loading" ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : null}
          </div>
        </section>

        <section className="portfolio-summary-grid" aria-label="Portfolio summary">
          <PortfolioSummaryCard label="Total Value" value={formatMoney(portfolio.totalValue)} series={portfolio.performanceSeries} />
          <PortfolioSummaryCard label="Unrealized PnL" value={formatSignedMoney(portfolio.unrealizedPnl)} tone={portfolio.unrealizedPnl < 0 ? "down" : "up"} series={portfolio.performanceSeries} />
          <PortfolioSummaryCard label="Open Positions" value={String(positions.length)} series={portfolio.performanceSeries} />
          <PortfolioSummaryCard label="Exposure" value={formatMoney(portfolio.exposure)} detail={portfolio.exposurePercent > 0 ? `${portfolio.exposurePercent.toFixed(1)}% of account` : "Pending"} series={portfolio.performanceSeries} />
          <PortfolioSummaryCard label="Today's Movement" value={formatSignedMoney(portfolio.todayMovement)} tone={portfolio.todayMovement < 0 ? "down" : "up"} detail={portfolio.todayMovementPercent !== 0 ? `${formatSignedPercent(portfolio.todayMovementPercent)}` : "No movement"} series={portfolio.performanceSeries} />
        </section>

        {message ? <p className={status === "error" ? "portfolio-message error" : "portfolio-message"}>{message}</p> : null}

        <div className="portfolio-grid">
          <div className="portfolio-main">
            <PerformancePanel series={portfolio.performanceSeries} totalValue={portfolio.totalValue} pnl={portfolio.unrealizedPnl} />
            <OpenPositionsPanel positions={positions} snapshots={snapshots} />
            <ExposureBreakdownPanel breakdowns={portfolio.breakdowns} />
            <RiskWatchPanel items={portfolio.risks} />
          </div>

          <aside className="portfolio-sidebar">
            <PortfolioSignalsPanel signals={portfolio.signals} />
            <AdjustPositionPanel
              snapshot={selectedSnapshot}
              amount={amount}
              estimatedShares={estimatedShares}
              onAmountChange={setAmount}
            />
            <RecentActivityPanel activities={portfolio.activities} />
          </aside>
        </div>

        {!session ? (
          <section className="panel portfolio-empty-session">
            <h2>Connect a wallet to load portfolio data</h2>
            <p>Positions, open CLOB orders, balances, and recent activity are read for the connected user account only.</p>
            <button type="button" onClick={connectWallet} disabled={status === "loading"}>
              {status === "loading" ? "Connecting..." : "Connect Wallet"}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function PortfolioTopbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/markets">Markets</Link>
        <Link href="/matches">Matches</Link>
        <Link href="/teams">Teams</Link>
        <Link href="/portfolio" aria-current="page">Portfolio</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}

function PortfolioAccountMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PortfolioSummaryCard({
  label,
  value,
  detail,
  tone,
  series,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "up" | "down";
  series: PortfolioSeriesPoint[];
}) {
  return (
    <article className={tone === "down" ? "portfolio-summary-card down" : tone === "up" ? "portfolio-summary-card up" : "portfolio-summary-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail ?? "Connected account"}</small>
      <MiniSparkline series={series} tone={tone} />
    </article>
  );
}

function MiniSparkline({ series, tone }: { series: PortfolioSeriesPoint[]; tone?: "up" | "down" }) {
  const values = series.length > 0 ? series.map((point) => point.value) : [0, 0, 0, 0, 0, 0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return (
    <div className="portfolio-sparkline" aria-hidden="true">
      {values.slice(-10).map((value, index) => (
        <i key={`${value}-${index}`} className={tone === "down" ? "down" : ""} style={{ height: `${18 + ((value - min) / range) * 30}px` }} />
      ))}
    </div>
  );
}

function PerformancePanel({
  series,
  totalValue,
  pnl,
}: {
  series: PortfolioSeriesPoint[];
  totalValue: number;
  pnl: number;
}) {
  return (
    <section className="panel portfolio-panel portfolio-performance-panel">
      <div className="panel-head">
        <h2 className="panel-title">Portfolio Performance</h2>
        <div className="team-detail-tabs">
          <span>1D</span>
          <strong>7D</strong>
          <span>30D</span>
          <span>All</span>
        </div>
      </div>
      <div className="portfolio-performance-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolio-performance-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#125afc" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#20c2e4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e3edf8" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#71809a", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={{ fill: "#71809a", fontSize: 10 }} tickFormatter={(value: number) => formatMoney(value)} tickLine={false} axisLine={false} width={62} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #dce8f5", borderRadius: 7, color: "#07142d" }}
              formatter={(value: number) => [formatMoney(value), "Value"]}
            />
            <Area type="monotone" dataKey="value" stroke="#125afc" strokeWidth={2} fill="url(#portfolio-performance-fill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="portfolio-performance-readout">
        <strong>{formatMoney(totalValue)}</strong>
        <span className={pnl < 0 ? "down" : "up"}>{formatSignedMoney(pnl)} unrealized</span>
      </div>
    </section>
  );
}

function OpenPositionsPanel({
  positions,
  snapshots,
}: {
  positions: UserPositionRecord[];
  snapshots: TeamMarketSnapshot[];
}) {
  return (
    <section id="open-positions" className="panel portfolio-panel open-positions-panel">
      <div className="panel-head">
        <h2 className="panel-title">Open Positions</h2>
        <span className="view-all">{positions.length > 0 ? `${positions.length} positions` : "No positions"}</span>
      </div>
      {positions.length > 0 ? (
        <div className="portfolio-position-table">
          <div className="portfolio-position-row head">
            <span>Market</span>
            <span>Position</span>
            <span>Probability</span>
            <span>Entry</span>
            <span>Current</span>
            <span>Value</span>
            <span>PnL</span>
            <span>Action</span>
          </div>
          {positions.map((position) => {
            const snapshot = findSnapshotForPosition(position, snapshots);
            const teamId = snapshot?.team.id;

            return (
              <div key={`${position.conditionId}:${position.asset}`} className="portfolio-position-row">
                <div className="portfolio-position-market">
                  {snapshot ? <TeamFlag code={snapshot.team.code} name={snapshot.team.name} /> : <span className="flag">?</span>}
                  <strong>{position.title}</strong>
                </div>
                <span>{position.outcome}</span>
                <span>{snapshot ? formatProbability(snapshot.market.probability) : formatPriceCents(position.curPrice)}</span>
                <span>{formatPriceCents(position.avgPrice)}</span>
                <span>{formatPriceCents(position.curPrice)}</span>
                <span>{formatMoney(position.currentValue)}</span>
                <span className={position.cashPnl < 0 ? "down" : "up"}>{formatSignedMoney(position.cashPnl)}</span>
                <div className="portfolio-position-actions">
                  <PlaceBidButton className="portfolio-action-link" teamName={snapshot?.team.name}>Add</PlaceBidButton>
                  <PlaceBidButton className="portfolio-action-link" teamName={snapshot?.team.name}>Manage</PlaceBidButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <PortfolioEmptyState title="No open positions" body="No current Polymarket positions were returned for the connected account." />
      )}
    </section>
  );
}

function ExposureBreakdownPanel({ breakdowns }: { breakdowns: ExposureBreakdown[] }) {
  return (
    <section className="panel portfolio-panel exposure-breakdown-panel">
      <div className="panel-head">
        <h2 className="panel-title">Exposure Breakdown</h2>
      </div>
      <div className="exposure-breakdown-grid">
        {breakdowns.map((breakdown) => (
          <DonutBreakdown key={breakdown.title} breakdown={breakdown} />
        ))}
      </div>
    </section>
  );
}

interface ExposureBreakdown {
  title: string;
  items: Array<{ label: string; value: number }>;
}

function DonutBreakdown({ breakdown }: { breakdown: ExposureBreakdown }) {
  const total = breakdown.items.reduce((sum, item) => sum + item.value, 0);
  const gradient = buildConicGradient(breakdown.items, total);

  return (
    <article className="donut-breakdown">
      <h3>{breakdown.title}</h3>
      <div className="donut-breakdown-body">
        <div className="donut" style={{ background: gradient }} />
        <div className="donut-legend">
          {breakdown.items.slice(0, 5).map((item, index) => (
            <span key={item.label}>
              <i style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
              {item.label} {total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function PortfolioSignalsPanel({ signals }: { signals: PortfolioSignal[] }) {
  return (
    <section className="panel portfolio-panel portfolio-signals-panel">
      <div className="panel-head">
        <h2 className="panel-title">Portfolio Signals</h2>
      </div>
      <div className="portfolio-signal-list">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <article key={signal.id} className="portfolio-signal-row">
              {signal.team ? <TeamFlag code={signal.team.team.code} name={signal.team.team.name} /> : <span className="flag">P</span>}
              <div>
                <h3>{signal.title}</h3>
                <p>{signal.detail}</p>
              </div>
              <strong className={signal.tone === "down" ? "down" : signal.tone === "up" ? "up" : ""}>{signal.value}</strong>
            </article>
          ))
        ) : (
          <PortfolioEmptyState title="No portfolio signals" body="Signals appear when connected positions or open orders create notable movement." />
        )}
      </div>
    </section>
  );
}

function AdjustPositionPanel({
  snapshot,
  amount,
  estimatedShares,
  onAmountChange,
}: {
  snapshot?: TeamMarketSnapshot;
  amount: string;
  estimatedShares: number;
  onAmountChange: (value: string) => void;
}) {
  return (
    <section className="panel portfolio-panel adjust-position-panel">
      <div className="panel-head">
        <h2 className="panel-title">Adjust Position</h2>
      </div>
      {snapshot ? (
        <>
          <div className="adjust-market-head">
            <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
            <div>
              <strong>{snapshot.team.name} to win World Cup</strong>
              <span>Position: YES</span>
            </div>
          </div>
          <div className="adjust-price-grid">
            <PanelMetric label="Market Price" value={formatProbability(snapshot.market.probability)} tone={snapshot.market.change24h < 0 ? "down" : "up"} detail={formatChange(snapshot.market.change24h)} />
            <PanelMetric label="Liquidity" value={snapshot.market.liquidity ? formatVolume(snapshot.market.liquidity) : "Pending"} />
          </div>
          <label className="portfolio-amount-input">
            <span>Amount</span>
            <input value={amount} onChange={(event) => onAmountChange(event.target.value)} inputMode="decimal" />
            <b>USDC</b>
          </label>
          <div className="adjust-estimate-grid">
            <PanelMetric label="Est. New Exposure" value={formatMoney(Number(amount) || 0)} />
            <PanelMetric label="Est. Shares" value={formatShareSize(estimatedShares)} />
            <PanelMetric label="Est. Payout" value={`${formatShareSize(estimatedShares)} USDC`} />
          </div>
          <PlaceBidButton className="bid-button full" teamName={snapshot.team.name}>
            Review Bid
          </PlaceBidButton>
        </>
      ) : (
        <PortfolioEmptyState title="No market selected" body="Markets will appear here after data loads." />
      )}
    </section>
  );
}

function PanelMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "up" | "down";
}) {
  return (
    <div className={tone === "down" ? "portfolio-mini-metric down" : tone === "up" ? "portfolio-mini-metric up" : "portfolio-mini-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function RiskWatchPanel({ items }: { items: RiskWatchItem[] }) {
  return (
    <section className="panel portfolio-panel risk-watch-panel">
      <div className="panel-head">
        <h2 className="panel-title">Risk Watch</h2>
        <span className="view-all">{items.length > 0 ? "View all" : "Clear"}</span>
      </div>
      <div className="risk-watch-grid">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.id} className="risk-watch-card">
              <span className={item.tone === "down" ? "risk-icon down" : item.tone === "up" ? "risk-icon up" : "risk-icon"} />
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <small>{item.exposure}</small>
              <strong className={item.impact === "High" ? "down" : item.impact === "Medium" ? "medium" : ""}>{item.impact} Impact</strong>
            </article>
          ))
        ) : (
          <PortfolioEmptyState title="No risk watch" body="No connected positions currently meet the portfolio watch criteria." />
        )}
      </div>
    </section>
  );
}

function RecentActivityPanel({ activities }: { activities: PortfolioActivity[] }) {
  return (
    <section className="panel portfolio-panel recent-activity-panel">
      <div className="panel-head">
        <h2 className="panel-title">Recent Activity</h2>
        <span className="view-all">View all</span>
      </div>
      <div className="activity-list">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <article key={activity.id} className="activity-row">
              <span className={activity.tone === "down" ? "activity-dot down" : activity.tone === "up" ? "activity-dot up" : "activity-dot"} />
              <div>
                <h3>{activity.title}</h3>
                <p>{activity.date}</p>
              </div>
              <strong className={activity.tone === "down" ? "down" : activity.tone === "up" ? "up" : ""}>{activity.value}</strong>
            </article>
          ))
        ) : (
          <PortfolioEmptyState title="No recent activity" body="Submitted orders and open CLOB activity will appear here." />
        )}
      </div>
    </section>
  );
}

interface PortfolioActivity {
  id: string;
  title: string;
  date: string;
  value: string;
  tone: "up" | "down" | "neutral";
  sortTime: number;
}

function PortfolioEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="portfolio-empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

async function fetchJson<T>(url: string): Promise<{ data?: T; error?: string }> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    return { error: payload.error ?? `Request failed: ${response.status}` };
  }

  return { data: payload };
}

function buildPortfolioView({
  positions,
  openOrders,
  orderHistory,
  snapshots,
  readiness,
}: {
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  orderHistory: UserOrderRecord[];
  snapshots: TeamMarketSnapshot[];
  readiness?: UserTradingReadiness;
}) {
  const totalValue = roundMoney(positions.reduce((sum, position) => sum + safeNumber(position.currentValue), 0));
  const unrealizedPnl = roundMoney(positions.reduce((sum, position) => sum + safeNumber(position.cashPnl), 0));
  const exposure = roundMoney(positions.reduce((sum, position) => sum + Math.max(safeNumber(position.currentValue), safeNumber(position.initialValue)), 0));
  const usdc = readiness?.balances?.usdcAvailable ?? 0;
  const denominator = exposure + usdc;
  const exposurePercent = denominator > 0 ? (exposure / denominator) * 100 : 0;
  const todayMovement = roundMoney(
    positions.reduce((sum, position) => {
      const snapshot = findSnapshotForPosition(position, snapshots);
      return sum + (snapshot ? safeNumber(position.currentValue) * (snapshot.market.change24h / 100) : 0);
    }, 0),
  );
  const todayMovementPercent = totalValue > 0 ? (todayMovement / totalValue) * 100 : 0;
  const performanceSeries = buildPerformanceSeries(positions, snapshots, totalValue, unrealizedPnl);
  const primaryTeam = getPrimarySnapshot(positions, snapshots);

  return {
    totalValue,
    unrealizedPnl,
    exposure,
    exposurePercent,
    todayMovement,
    todayMovementPercent,
    performanceSeries,
    primaryTeam,
    signals: buildPortfolioSignals(positions, openOrders, snapshots),
    risks: buildRiskWatch(positions, openOrders, readiness, snapshots),
    activities: buildActivities(orderHistory, openOrders),
    breakdowns: buildExposureBreakdowns(positions, snapshots),
  };
}

function buildPerformanceSeries(
  positions: UserPositionRecord[],
  snapshots: TeamMarketSnapshot[],
  totalValue: number,
  pnl: number,
): PortfolioSeriesPoint[] {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
  });

  if (positions.length === 0 || totalValue <= 0) {
    return dates.map((date) => ({ date, value: 0 }));
  }

  const base = Math.max(0, totalValue - pnl);
  const movementBias = positions.reduce((sum, position) => {
    const snapshot = findSnapshotForPosition(position, snapshots);
    return sum + (snapshot?.market.change7d ?? 0) * safeNumber(position.currentValue) * 0.003;
  }, 0);

  return dates.map((date, index) => {
    const progress = index / Math.max(1, dates.length - 1);
    const value = base + pnl * progress + Math.sin(index * 1.7) * movementBias;
    return { date, value: roundMoney(Math.max(0, value)) };
  });
}

function buildPortfolioSignals(
  positions: UserPositionRecord[],
  openOrders: UserOpenOrder[],
  snapshots: TeamMarketSnapshot[],
): PortfolioSignal[] {
  const positionSignals = [...positions]
    .sort((a, b) => Math.abs(safeNumber(b.cashPnl)) - Math.abs(safeNumber(a.cashPnl)))
    .slice(0, 4)
    .map((position) => {
      const snapshot = findSnapshotForPosition(position, snapshots);
      const pnl = safeNumber(position.cashPnl);

      return {
        id: `${position.conditionId}:${position.asset}`,
        title: `${position.title}`,
        detail: `${position.outcome} position ${pnl >= 0 ? "gained" : "moved lower"} on current account data.`,
        value: formatSignedMoney(pnl),
        tone: pnl > 0 ? "up" : pnl < 0 ? "down" : "neutral",
        team: snapshot,
      } satisfies PortfolioSignal;
    });

  if (positionSignals.length > 0) {
    return positionSignals;
  }

  return openOrders.slice(0, 4).map((order) => ({
    id: order.id,
    title: `${order.outcome || order.asset_id} open order`,
    detail: `${order.order_type} ${order.side} order is ${order.status}.`,
    value: order.price,
    tone: "neutral",
  }));
}

function buildRiskWatch(
  positions: UserPositionRecord[],
  openOrders: UserOpenOrder[],
  readiness: UserTradingReadiness | undefined,
  snapshots: TeamMarketSnapshot[],
): RiskWatchItem[] {
  const risks: RiskWatchItem[] = [];
  const totalValue = positions.reduce((sum, position) => sum + safeNumber(position.currentValue), 0);

  for (const position of positions) {
    const snapshot = findSnapshotForPosition(position, snapshots);
    const pnl = safeNumber(position.cashPnl);
    const share = totalValue > 0 ? safeNumber(position.currentValue) / totalValue : 0;

    if (pnl < 0 || share > 0.28 || Math.abs(snapshot?.market.change24h ?? 0) >= 2) {
      risks.push({
        id: `${position.conditionId}:${position.asset}`,
        title: position.title,
        detail: pnl < 0 ? "Position is below entry value." : "Position has notable concentration or market movement.",
        exposure: `Exposure: ${formatMoney(position.currentValue)}`,
        impact: share > 0.4 || pnl < -250 ? "High" : share > 0.2 ? "Medium" : "Low",
        tone: pnl < 0 ? "down" : "neutral",
      });
    }
  }

  if (openOrders.length > 0) {
    risks.push({
      id: "open-orders",
      title: "Open CLOB orders",
      detail: `${openOrders.length} open order${openOrders.length === 1 ? "" : "s"} returned for the account.`,
      exposure: "Monitor unmatched orders",
      impact: "Medium",
      tone: "neutral",
    });
  }

  const failedCheck = readiness?.checks.find((check) => check.status === "fail");
  if (failedCheck) {
    risks.push({
      id: `readiness-${failedCheck.id}`,
      title: failedCheck.label,
      detail: failedCheck.detail,
      exposure: "Account readiness",
      impact: failedCheck.id === "eligibility" ? "High" : "Medium",
      tone: "down",
    });
  }

  return risks.slice(0, 5);
}

function buildActivities(orderHistory: UserOrderRecord[], openOrders: UserOpenOrder[]): PortfolioActivity[] {
  const historyActivities = orderHistory.map((order) => ({
    id: order.id,
    title: `${titleCase(order.status.replace(/_/g, " "))} ${order.preview.teamId.toUpperCase()} (${order.preview.outcome.toUpperCase()})`,
    date: formatDateTime(order.updatedAt),
    value: order.preview.estimatedTotalCost ? formatMoney(order.preview.estimatedTotalCost) : formatShareSize(order.preview.size),
    tone: order.status === "filled" || order.status === "submitted" || order.status === "open" ? "up" : order.status === "error" || order.status === "rejected" ? "down" : "neutral",
    sortTime: new Date(order.updatedAt).getTime(),
  } satisfies PortfolioActivity));
  const openOrderActivities = openOrders.map((order) => ({
    id: order.id,
    title: `Open ${order.side} ${order.outcome || order.asset_id}`,
    date: formatUnixSeconds(order.created_at),
    value: order.price,
    tone: "neutral",
    sortTime: order.created_at * 1000,
  } satisfies PortfolioActivity));

  return [...historyActivities, ...openOrderActivities]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 8);
}

function buildExposureBreakdowns(
  positions: UserPositionRecord[],
  snapshots: TeamMarketSnapshot[],
): ExposureBreakdown[] {
  const byTeam = groupExposure(positions, (position) => findSnapshotForPosition(position, snapshots)?.team.name ?? position.title);
  const byOutcome = groupExposure(positions, (position) => position.outcome || "Unknown");
  const byMarketType = groupExposure(positions, (position) => position.title.toLowerCase().includes("winner") || position.title.toLowerCase().includes("world cup") ? "Winner" : "Other markets");
  const byRisk = groupExposure(positions, (position) => safeNumber(position.cashPnl) < 0 ? "Drawdown" : safeNumber(position.percentPnl) > 20 ? "High gain" : "Stable");

  return [
    { title: "By Team", items: byTeam },
    { title: "By Outcome", items: byOutcome },
    { title: "By Market Type", items: byMarketType },
    { title: "By Risk Level", items: byRisk },
  ];
}

function groupExposure(
  positions: UserPositionRecord[],
  getLabel: (position: UserPositionRecord) => string,
): Array<{ label: string; value: number }> {
  const grouped = new Map<string, number>();

  for (const position of positions) {
    const label = getLabel(position);
    grouped.set(label, (grouped.get(label) ?? 0) + safeNumber(position.currentValue));
  }

  const rows = [...grouped.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  if (rows.length <= 4) {
    return rows.length > 0 ? rows : [{ label: "No exposure", value: 1 }];
  }

  const visible = rows.slice(0, 4);
  const other = rows.slice(4).reduce((sum, item) => sum + item.value, 0);

  return [...visible, { label: "Other", value: other }];
}

function buildConicGradient(items: Array<{ label: string; value: number }>, total: number): string {
  if (total <= 0) {
    return "#eef6ff";
  }

  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 100;
    cursor = end;
    return `${DONUT_COLORS[index % DONUT_COLORS.length]} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function getPrimarySnapshot(positions: UserPositionRecord[], snapshots: TeamMarketSnapshot[]) {
  const firstPosition = [...positions].sort((a, b) => safeNumber(b.currentValue) - safeNumber(a.currentValue))[0];
  return firstPosition ? findSnapshotForPosition(firstPosition, snapshots) ?? snapshots[0] : snapshots[0];
}

function findSnapshotForPosition(position: UserPositionRecord, snapshots: TeamMarketSnapshot[]): TeamMarketSnapshot | undefined {
  const text = `${position.title} ${position.slug} ${position.eventSlug ?? ""}`.toLowerCase();

  return snapshots.find((snapshot) => {
    const names = [snapshot.team.id, snapshot.team.name, snapshot.team.code, ...(snapshot.team.aliases ?? [])]
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    return names.some((name) => text.includes(name));
  });
}

function getAccountStatusCopy(
  session: TradingUserSession | undefined,
  readiness: UserTradingReadiness | undefined,
  status: LoadStatus,
): string {
  if (status === "loading") {
    return "Loading";
  }

  if (!session) {
    return "Connect";
  }

  if (readiness?.ready) {
    return "Ready";
  }

  return "Needs review";
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value);
}

function formatSignedMoney(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatMoney(value)}`;
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatUnixSeconds(value: number): string {
  if (!Number.isFinite(value)) {
    return "Pending";
  }

  return formatDateTime(new Date(value * 1000).toISOString());
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

function safeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? value ?? 0 : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
