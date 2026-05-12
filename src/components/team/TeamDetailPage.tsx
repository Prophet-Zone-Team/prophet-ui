"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MockBid,
  NewsEvent,
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
} from "../../types/market";
import { calculatePotentialPayout } from "../../lib/market/mockBid";
import {
  readStoredBids,
  readStoredWatchlist,
  writeStoredBids,
  writeStoredWatchlist,
} from "../../lib/storage/local-terminal";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getChangeTone,
  getSentimentLabel,
} from "../home/market-formatters";

interface TeamDetailPageProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  relatedNews: NewsEvent[];
}

export function TeamDetailPage({ snapshot, probabilityHistory, relatedNews }: TeamDetailPageProps) {
  const { team, market } = snapshot;
  const mismatch = market.probability - market.bookmakerImpliedProbability;

  return (
    <main className="terminal-grid min-h-screen px-4 py-5 sm:px-7 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-8 lg:gap-9">
        <TeamHeader snapshot={snapshot} />

        <div className="grid gap-8 xl:grid-cols-[1.45fr_0.9fr]">
          <ProbabilityChart history={probabilityHistory} teamName={team.name} />
          <div className="flex flex-col gap-8">
            <MarketStats snapshot={snapshot} />
            <OddsVsMarket
              marketProbability={market.probability}
              bookmakerProbability={market.bookmakerImpliedProbability}
              mismatch={mismatch}
            />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_0.82fr]">
          <RelatedNews news={relatedNews} teamName={team.name} />
          <div className="flex flex-col gap-8">
            <MockBidPanel snapshot={snapshot} />
            <WatchlistButton teamId={team.id} teamName={team.name} />
          </div>
        </div>
      </div>
    </main>
  );
}

function TeamHeader({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const { team, market } = snapshot;
  const isPositive = market.change24h >= 0;

  return (
    <section className="overflow-hidden rounded-lg border border-terminal-line bg-terminal-panel/90 shadow-terminal">
      <div className="border-b border-terminal-line/80 bg-black/30 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-terminal-amber/50 bg-terminal-amber/10 text-lg font-semibold text-terminal-amber">
              {team.code}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-terminal-muted">Team market detail</p>
              <p className="mt-1 text-lg font-semibold text-terminal-text">{team.name}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[620px]">
            <TopbarMetric label="Probability" value={formatProbability(market.probability)} />
            <TopbarMetric
              label="24h move"
              value={formatChange(market.change24h)}
              valueClassName={getChangeTone(market.change24h)}
            />
            <TopbarMetric label="Mock volume" value={formatVolume(market.volume)} />
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-8 lg:p-9">
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-terminal-muted">
        <Link href="/" className="hover:text-terminal-cyan">
          Back to market heatmap
        </Link>
        <Link href="/feed" className="hover:text-terminal-cyan">
          Feed
        </Link>
        <Link href="/bid" className="hover:text-terminal-cyan">
          Mock bid
        </Link>
        <Link href="/watchlist" className="hover:text-terminal-cyan">
          Watchlist
        </Link>
      </div>
      <div className="mt-8 grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-terminal-muted">
            <span className="border border-terminal-line px-2.5 py-1">{team.code}</span>
            <span>Group {team.group}</span>
            <span>{team.region}</span>
            <span className={isPositive ? "text-terminal-green" : "text-terminal-red"}>
              {isPositive ? "Rising" : "Falling"}
            </span>
          </div>
          <h1 className="mt-5 font-display text-5xl leading-none text-terminal-text sm:text-7xl">
            {team.name}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-terminal-muted">
            Team detail terminal for mock market probability, momentum, bookmaker divergence,
            related news context, and simulated bid outcomes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <HeaderMetric label="Current probability" value={formatProbability(market.probability)} />
          <HeaderMetric
            label="24h change"
            value={formatChange(market.change24h)}
            valueClassName={getChangeTone(market.change24h)}
          />
          <HeaderMetric label="Volume" value={formatVolume(market.volume)} />
        </div>
      </div>
      </div>
    </section>
  );
}

function TopbarMetric({
  label,
  value,
  valueClassName = "text-terminal-text",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border-l border-terminal-line/80 pl-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
  valueClassName = "text-terminal-text",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/80 p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-muted">{label}</p>
      <p className={`mt-3 text-3xl font-semibold leading-none ${valueClassName}`}>{value}</p>
    </div>
  );
}

function ProbabilityChart({
  history,
  teamName,
}: {
  history: ProbabilityHistoryPoint[];
  teamName: string;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <SectionHeader
        eyebrow="30 day probability"
        title="Probability Chart"
        description={`${teamName} market probability over the last 30 mock trading days.`}
      />
      <div className="mt-8 rounded-lg border border-terminal-line bg-terminal-panel2/40 p-3">
      <div className="h-[320px] sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="probability-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#24d18b" stopOpacity={0.36} />
                <stop offset="95%" stopColor="#24d18b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#7c8996", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "#7c8996", fontSize: 11 }}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#101823",
                border: "1px solid #223040",
                borderRadius: 8,
                color: "#e7eef5",
              }}
              formatter={(value: number) => [formatProbability(value), "Probability"]}
              labelStyle={{ color: "#7c8996" }}
            />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#24d18b"
              strokeWidth={2}
              fill="url(#probability-fill)"
              activeDot={{ r: 5, stroke: "#57c7ff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </div>
    </section>
  );
}

function MarketStats({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const { team, market } = snapshot;
  const stats = [
    { label: "Team", value: team.name },
    { label: "Current probability", value: formatProbability(market.probability) },
    { label: "24h change", value: formatChange(market.change24h), tone: getChangeTone(market.change24h) },
    { label: "7d change", value: formatChange(market.change7d), tone: getChangeTone(market.change7d) },
    { label: "Volume", value: formatVolume(market.volume) },
    { label: "Sentiment", value: getSentimentLabel(market.sentiment) },
  ];

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Market stats" title="Market Stats" />
      <div className="mt-7 grid gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between gap-4 border-b border-terminal-line/70 pb-4 last:border-b-0 last:pb-0">
            <p className="text-xs uppercase tracking-[0.18em] text-terminal-muted">{stat.label}</p>
            <p className={`text-right text-sm font-semibold ${stat.tone ?? "text-terminal-text"}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OddsVsMarket({
  marketProbability,
  bookmakerProbability,
  mismatch,
}: {
  marketProbability: number;
  bookmakerProbability: number;
  mismatch: number;
}) {
  const data = [
    { source: "Market", probability: marketProbability },
    { source: "Bookmaker", probability: bookmakerProbability },
  ];

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Divergence" title="Odds vs Market Probability" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <ProbabilityBadge label="Market" value={marketProbability} tone="text-terminal-cyan" />
        <ProbabilityBadge label="Bookmaker" value={bookmakerProbability} tone="text-terminal-amber" />
      </div>
      <div className="mt-7 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" hide domain={[0, "dataMax + 4"]} />
            <YAxis
              type="category"
              dataKey="source"
              width={86}
              tick={{ fill: "#7c8996", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#101823",
                border: "1px solid #223040",
                borderRadius: 8,
                color: "#e7eef5",
              }}
              formatter={(value: number) => [formatProbability(value), "Probability"]}
              labelStyle={{ color: "#7c8996" }}
            />
            <Bar dataKey="probability" fill="#57c7ff" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className={`mt-4 text-sm font-semibold ${mismatch >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
        {formatChange(mismatch)} market-bookmaker spread
      </p>
      <p className="mt-2 text-xs leading-5 text-terminal-muted">
        This compares mock market probability with bookmaker implied probability. It is market context,
        not a recommendation.
      </p>
    </section>
  );
}

function ProbabilityBadge({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold leading-none ${tone}`}>{formatProbability(value)}</p>
    </div>
  );
}

function RelatedNews({ news, teamName }: { news: NewsEvent[]; teamName: string }) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7 lg:p-8">
      <SectionHeader eyebrow="News context" title="Related News" />
      <div className="mt-7 grid gap-4">
        {news.length > 0 ? (
          news.map((item) => (
            <article key={item.id} className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-muted">{item.source}</p>
                <p className={item.impactScore >= 0 ? "text-xs text-terminal-green" : "text-xs text-terminal-red"}>
                  Impact {item.impactScore >= 0 ? "+" : ""}
                  {item.impactScore}
                </p>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-terminal-text">{item.headline}</h3>
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{item.summary}</p>
              <p className="mt-4 text-xs text-terminal-muted">{item.publishedAt.slice(0, 10)}</p>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
            <h3 className="text-lg font-semibold text-terminal-text">No major mock news events for {teamName}</h3>
            <p className="mt-2 text-sm leading-6 text-terminal-muted">
              Current movement is driven by market data in this mock dataset rather than a tagged news event.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function MockBidPanel({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const { team, market } = snapshot;
  const [stake, setStake] = useState("100");
  const [savedBids, setSavedBids] = useState<MockBid[]>([]);

  useEffect(() => {
    setSavedBids(readStoredBids().filter((bid) => bid.teamId === team.id));
  }, [team.id]);

  const numericStake = Number(stake);
  const safeStake = Number.isFinite(numericStake) && numericStake > 0 ? numericStake : 0;
  const potentialReturn = useMemo(() => {
    if (safeStake <= 0 || market.probability <= 0) {
      return 0;
    }

    return calculatePotentialPayout(safeStake, market.probability);
  }, [market.probability, safeStake]);

  function saveMockBid() {
    if (safeStake <= 0) {
      return;
    }

    const nextBid: MockBid = {
      id: `mock-bid-${team.id}-${Date.now()}`,
      teamId: team.id,
      side: "yes",
      stake: safeStake,
      probabilityAtBid: market.probability,
      potentialReturn,
      status: "simulated",
      createdAt: new Date().toISOString(),
    };
    const nextBids = [nextBid, ...readStoredBids()];

    writeStoredBids(nextBids);
    setSavedBids(nextBids.filter((bid) => bid.teamId === team.id));
  }

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Simulation only" title="Mock Bid Panel" />
      <p className="mt-4 rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 p-4 text-sm leading-6 text-terminal-amber">
        Mock bid only. This is not financial advice and does not execute a real trade.
      </p>
      <div className="mt-7 rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
        <label className="block text-[10px] uppercase tracking-[0.22em] text-terminal-muted" htmlFor="mock-stake">
          Mock stake
        </label>
        <input
          id="mock-stake"
          type="number"
          min="1"
          value={stake}
          onChange={(event) => setStake(event.target.value)}
          className="mt-3 w-full rounded border border-terminal-line bg-terminal-black px-4 py-3 text-terminal-text outline-none focus:border-terminal-cyan"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ScenarioMetric label="Probability at simulation" value={formatProbability(market.probability)} />
          <ScenarioMetric label="Potential simulated return" value={`$${potentialReturn.toFixed(2)}`} />
        </div>
        <button
          type="button"
          onClick={saveMockBid}
          className="mt-5 w-full rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20"
        >
          Save mock scenario
        </button>
        <p className="mt-4 text-xs leading-5 text-terminal-muted">
          Saved scenarios stay in this browser only. No wallet, payment, backend, or trade venue is connected.
        </p>
      </div>
      {savedBids.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {savedBids.slice(0, 3).map((bid) => (
            <div key={bid.id} className="flex items-center justify-between gap-4 rounded border border-terminal-line bg-terminal-panel2/60 p-3">
              <p className="text-xs text-terminal-muted">${bid.stake.toFixed(2)} mock stake</p>
              <p className="text-xs font-semibold text-terminal-text">${bid.potentialReturn.toFixed(2)} scenario</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function WatchlistButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    const ids = readStoredWatchlist();
    setIsWatching(ids.includes(teamId));
  }, [teamId]);

  function toggleWatchlist() {
    const ids = readStoredWatchlist();
    const nextIds = ids.includes(teamId) ? ids.filter((id) => id !== teamId) : [teamId, ...ids];

    writeStoredWatchlist(nextIds);
    setIsWatching(nextIds.includes(teamId));
  }

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <p className="text-[10px] uppercase tracking-[0.22em] text-terminal-cyan">Watchlist</p>
      <h2 className="mt-3 font-display text-3xl text-terminal-text">Watchlist</h2>
      <p className="mt-3 text-sm leading-6 text-terminal-muted">
        Track this team locally and surface it on the watchlist board.
      </p>
      <button
        type="button"
        onClick={toggleWatchlist}
        className="mt-6 w-full rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-4 py-3 text-sm font-semibold text-terminal-cyan transition hover:bg-terminal-cyan/20"
      >
        {isWatching ? `Watching ${teamName}` : `Add ${teamName} to watchlist`}
      </button>
    </section>
  );
}

function ScenarioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-terminal-text">{value}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl text-terminal-text sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-terminal-muted">{description}</p> : null}
    </div>
  );
}
