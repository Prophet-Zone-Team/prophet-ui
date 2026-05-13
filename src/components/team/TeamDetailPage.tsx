"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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

import type { MarketDataMeta } from "../../data/providers/types";
import type {
  ApiFootballDataIssue,
  ApiFootballFixtureContext,
  ApiFootballInjuryContext,
  ApiFootballOddContext,
  ApiFootballSquadPlayer,
  ApiFootballStandingContext,
  ApiFootballTeamProfile,
  MockBid,
  NewsEvent,
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
} from "../../types/market";
import {
  calculateMockOrderSimulation,
  calculateReferencePrice,
  formatPriceCents,
  formatShareSize,
} from "../../lib/market/mockBid";
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
import { DataStatusBanner, SourceDisclosure } from "../data/DataStatusBanner";

interface TeamDetailPageProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  relatedNews: NewsEvent[];
  footballProfile?: ApiFootballTeamProfile;
  footballFixtures: ApiFootballFixtureContext[];
  footballSquad: ApiFootballSquadPlayer[];
  footballInjuries: ApiFootballInjuryContext[];
  footballStandings: ApiFootballStandingContext[];
  footballOdds: ApiFootballOddContext[];
  footballDataIssues: ApiFootballDataIssue[];
  dataStatus: MarketDataMeta;
}

export function TeamDetailPage({
  snapshot,
  probabilityHistory,
  relatedNews,
  footballProfile,
  footballFixtures,
  footballSquad,
  footballInjuries,
  footballStandings,
  footballOdds,
  footballDataIssues,
  dataStatus,
}: TeamDetailPageProps) {
  const { team, market } = snapshot;
  const mismatch = market.probability - market.bookmakerImpliedProbability;

  return (
    <main className="terminal-grid min-h-screen px-4 py-5 sm:px-7 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-8 lg:gap-9">
        <TeamHeader snapshot={snapshot} source={dataStatus.source} />
        <DataStatusBanner meta={dataStatus} />
        <SourceDisclosure compact />

        <div className="grid gap-8 xl:grid-cols-[1.45fr_0.9fr]">
          <ProbabilityChart history={probabilityHistory} teamName={team.name} />
          <div className="flex flex-col gap-8">
            <MarketStats snapshot={snapshot} />
            <OddsVsMarket
              marketProbability={market.probability}
              bookmakerProbability={market.bookmakerImpliedProbability}
              mismatch={mismatch}
              oddsMeta={dataStatus.odds}
            />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_0.82fr]">
          <RelatedNews news={relatedNews} teamName={team.name} />
          <div className="flex flex-col gap-8">
            <FootballContextPanel
              profile={footballProfile}
              fixtures={footballFixtures}
              squad={footballSquad}
              injuries={footballInjuries}
              standings={footballStandings}
              odds={footballOdds}
              dataIssues={footballDataIssues}
              teamName={team.name}
            />
            <MockBidPanel snapshot={snapshot} />
            <WatchlistButton teamId={team.id} teamName={team.name} />
          </div>
        </div>
      </div>
    </main>
  );
}

function FootballContextPanel({
  profile,
  fixtures,
  squad,
  injuries,
  standings,
  odds,
  dataIssues,
  teamName,
}: {
  profile?: ApiFootballTeamProfile;
  fixtures: ApiFootballFixtureContext[];
  squad: ApiFootballSquadPlayer[];
  injuries: ApiFootballInjuryContext[];
  standings: ApiFootballStandingContext[];
  odds: ApiFootballOddContext[];
  dataIssues: ApiFootballDataIssue[];
  teamName: string;
}) {
  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="API-Football" title="Team Context" />
      {profile ? (
        <div className="mt-6 grid gap-5">
          <div className="flex items-center gap-4">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={`${profile.name} crest`}
                className="h-14 w-14 rounded border border-terminal-line bg-terminal-panel2 object-contain p-2"
              />
            ) : null}
            <div>
              <h3 className="text-xl font-semibold text-terminal-text">{profile.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-terminal-muted">
                {profile.country} / API team {profile.apiFootballTeamId}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ContextMetric label="Founded" value={profile.founded ? String(profile.founded) : "Not listed"} />
            <ContextMetric label="Code" value={profile.code ?? "Not listed"} />
            <ContextMetric label="Venue" value={profile.venue?.name ?? "Not listed"} />
            <ContextMetric label="City" value={profile.venue?.city ?? "Not listed"} />
          </div>
          <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Upcoming fixtures</p>
            <div className="mt-4 grid gap-3">
              {fixtures.length > 0 ? (
                fixtures.slice(0, 3).map((fixture) => (
                  <div key={fixture.fixtureId} className="border-b border-terminal-line/70 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm font-semibold text-terminal-text">
                      {fixture.homeAway === "home" ? "vs" : "at"} {fixture.opponentName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-terminal-muted">
                      {formatFixtureDate(fixture.kickoffAt)}
                      {fixture.leagueName ? ` / ${fixture.leagueName}` : ""}
                      {fixture.venueName ? ` / ${fixture.venueName}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-terminal-muted">No upcoming fixtures stored yet.</p>
              )}
            </div>
          </div>
          <ApiFootballDataGrid
            squad={squad}
            injuries={injuries}
            standings={standings}
            odds={odds}
            dataIssues={dataIssues}
          />
          <p className="text-xs leading-5 text-terminal-muted">
            API-Football profile data is structural context only. It does not execute trades or imply a market view.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
          <h3 className="text-lg font-semibold text-terminal-text">No API-Football profile for {teamName}</h3>
          <p className="mt-2 text-sm leading-6 text-terminal-muted">
            The market view remains available, but the structured football profile is not attached yet.
          </p>
        </div>
      )}
    </section>
  );
}

function ApiFootballDataGrid({
  squad,
  injuries,
  standings,
  odds,
  dataIssues,
}: {
  squad: ApiFootballSquadPlayer[];
  injuries: ApiFootballInjuryContext[];
  standings: ApiFootballStandingContext[];
  odds: ApiFootballOddContext[];
  dataIssues: ApiFootballDataIssue[];
}) {
  return (
    <div className="grid gap-4">
      <DataSlicePanel title="Squad" emptyMessage={getIssueMessage(dataIssues, "squad") ?? "No squad stored yet."}>
        {squad.slice(0, 6).map((player) => (
          <MiniRow
            key={player.playerId}
            title={player.name}
            detail={[player.position, player.age ? `${player.age} yrs` : undefined].filter(Boolean).join(" / ")}
          />
        ))}
      </DataSlicePanel>
      <DataSlicePanel title="Injuries" emptyMessage={getIssueMessage(dataIssues, "injuries") ?? "No injuries stored yet."}>
        {injuries.slice(0, 4).map((injury) => (
          <MiniRow
            key={`${injury.playerName}-${injury.fixtureId ?? injury.reason ?? "injury"}`}
            title={injury.playerName}
            detail={[injury.reason, injury.leagueName].filter(Boolean).join(" / ")}
            tone="text-terminal-red"
          />
        ))}
      </DataSlicePanel>
      <DataSlicePanel title="Standings" emptyMessage={getIssueMessage(dataIssues, "standings") ?? "No standings stored yet."}>
        {standings.slice(0, 2).map((standing) => (
          <MiniRow
            key={`${standing.leagueName ?? "league"}-${standing.group ?? "group"}-${standing.rank ?? "rank"}`}
            title={`${standing.leagueName ?? "Competition"} ${standing.rank ? `#${standing.rank}` : ""}`}
            detail={[standing.group, standing.points !== undefined ? `${standing.points} pts` : undefined, standing.form].filter(Boolean).join(" / ")}
          />
        ))}
      </DataSlicePanel>
      <DataSlicePanel title="Odds" emptyMessage={getIssueMessage(dataIssues, "odds") ?? "No odds stored yet."}>
        {odds.slice(0, 4).map((odd) => (
          <MiniRow
            key={`${odd.fixtureId}-${odd.bookmaker}-${odd.marketName}-${odd.selectionName}`}
            title={odd.selectionName ?? odd.marketName ?? "Selection"}
            detail={[odd.bookmaker, odd.marketName, odd.odd].filter(Boolean).join(" / ")}
          />
        ))}
      </DataSlicePanel>
    </div>
  );
}

function DataSlicePanel({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{title}</p>
      <div className="mt-3 grid gap-2">
        {hasRows ? children : <p className="text-sm leading-6 text-terminal-muted">{emptyMessage}</p>}
      </div>
    </div>
  );
}

function MiniRow({ title, detail, tone = "text-terminal-text" }: { title: string; detail: string; tone?: string }) {
  return (
    <div className="border-b border-terminal-line/70 pb-2 last:border-b-0 last:pb-0">
      <p className={`text-sm font-semibold ${tone}`}>{title}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-terminal-muted">{detail}</p> : null}
    </div>
  );
}

function getIssueMessage(
  issues: ApiFootballDataIssue[],
  dimension: ApiFootballDataIssue["dimension"],
): string | undefined {
  return issues.find((issue) => issue.dimension === dimension)?.message;
}

function formatFixtureDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ContextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-terminal-text">{value}</p>
    </div>
  );
}

function TeamHeader({ snapshot, source }: { snapshot: TeamMarketSnapshot; source: MarketDataMeta["source"] }) {
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
            <TopbarMetric label="Market volume" value={formatVolume(market.volume)} />
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-8 lg:p-9">
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-terminal-muted">
        <Link href={`/?source=${source}`} className="hover:text-terminal-cyan">
          Back to market heatmap
        </Link>
        <Link href={`/feed?source=${source}`} className="hover:text-terminal-cyan">
          Feed
        </Link>
        <Link href={`/bid?source=${source}`} className="hover:text-terminal-cyan">
          Mock bid
        </Link>
        <Link href={`/watchlist?source=${source}`} className="hover:text-terminal-cyan">
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
            Team detail terminal for market probability, momentum, pricing divergence,
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
        description={`${teamName} market probability over the latest available snapshot window.`}
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
  oddsMeta,
}: {
  marketProbability: number;
  bookmakerProbability: number;
  mismatch: number;
  oddsMeta?: MarketDataMeta["odds"];
}) {
  const hasLiveOdds = oddsMeta?.status === "live";
  const data = [
    { source: "Market", probability: marketProbability },
    { source: "Bookmaker", probability: bookmakerProbability },
  ];

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Divergence" title="Odds vs Market Probability" />
      {!hasLiveOdds ? (
        <div className="mt-5 rounded-lg border border-terminal-amber/45 bg-terminal-amber/10 p-4 text-xs leading-5 text-terminal-amber">
          Bookmaker outright odds are not live for this snapshot. The comparison below uses the current provider-side
          fallback and should be treated as lower-confidence context.
        </div>
      ) : null}
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
        This compares market probability with {hasLiveOdds ? "median bookmaker implied probability" : "the available comparison probability"}.
        It is market context, not a recommendation.
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
      <SectionHeader eyebrow="News context" title="Recent Related News" />
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
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block text-lg font-semibold text-terminal-text transition hover:text-terminal-cyan"
                >
                  {item.headline}
                </a>
              ) : (
                <h3 className="mt-4 text-lg font-semibold text-terminal-text">{item.headline}</h3>
              )}
              <p className="mt-2 text-sm leading-6 text-terminal-muted">{item.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-terminal-muted">
                <span>{item.publishedAt.slice(0, 10)}</span>
                {item.matchedKeywords && item.matchedKeywords.length > 0 ? (
                  <span>/ {item.matchedKeywords.slice(0, 4).join(", ")}</span>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-terminal-line bg-terminal-panel2/75 p-5">
            <h3 className="text-lg font-semibold text-terminal-text">No recent related news for {teamName}</h3>
            <p className="mt-2 text-sm leading-6 text-terminal-muted">
              No qualifying GDELT coverage is currently attached to this market move. The absence of a tagged article
              does not explain the probability move.
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
  const yesPrice = calculateReferencePrice(market.probability, "yes");
  const simulation = useMemo(
    () =>
      calculateMockOrderSimulation({
        teamId: team.id,
        teamCode: team.code,
        side: "yes",
        stake: safeStake,
        probability: market.probability,
        limitPrice: yesPrice,
        orderType: "GTC",
      }),
    [market.probability, safeStake, team.code, team.id, yesPrice],
  );

  function saveMockBid() {
    if (safeStake <= 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    const nextSimulation = calculateMockOrderSimulation({
      teamId: team.id,
      teamCode: team.code,
      side: "yes",
      stake: safeStake,
      probability: market.probability,
      limitPrice: yesPrice,
      orderType: "GTC",
      createdAt,
      includeOrderId: true,
    });
    const nextBid: MockBid = {
      id: `mock-bid-${team.id}-${Date.now()}`,
      teamId: team.id,
      side: "yes",
      stake: safeStake,
      probabilityAtBid: market.probability,
      potentialReturn: nextSimulation.potentialPayout,
      status: "simulated",
      createdAt,
      limitPrice: nextSimulation.sidePrice,
      shareSize: nextSimulation.shareSize,
      orderType: "GTC",
      simulatedOrderId: nextSimulation.simulatedOrderId,
      simulatedTokenId: nextSimulation.simulatedTokenId,
      estimatedCost: nextSimulation.estimatedCost,
      potentialOutcome: nextSimulation.potentialOutcome,
    };
    const nextBids = [nextBid, ...readStoredBids()];

    writeStoredBids(nextBids);
    setSavedBids(nextBids.filter((bid) => bid.teamId === team.id));
  }

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-5 shadow-terminal sm:p-7">
      <SectionHeader eyebrow="Simulation only" title="Mock Bid Panel" />
      <p className="mt-4 rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 p-4 text-sm leading-6 text-terminal-amber">
        Mock bid only. This is not financial advice and does not execute a real trade or CLOB order.
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
          <ScenarioMetric label="YES price" value={formatPriceCents(simulation.sidePrice)} />
          <ScenarioMetric label="Simulated shares" value={formatShareSize(simulation.shareSize)} />
          <ScenarioMetric label="Potential payout" value={`$${simulation.potentialPayout.toFixed(2)}`} />
          <ScenarioMetric label="Potential outcome" value={`$${simulation.potentialOutcome.toFixed(2)}`} />
        </div>
        <button
          type="button"
          onClick={saveMockBid}
          className="mt-5 w-full rounded border border-terminal-green/60 bg-terminal-green/12 px-4 py-3 text-sm font-semibold text-terminal-green transition hover:bg-terminal-green/20"
        >
          Save mock scenario
        </button>
        <p className="mt-4 text-xs leading-5 text-terminal-muted">
          Saved scenarios stay in this browser only. No wallet, API key, backend, or trade venue is connected.
        </p>
      </div>
      {savedBids.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {savedBids.slice(0, 3).map((bid) => (
            <div key={bid.id} className="flex items-center justify-between gap-4 rounded border border-terminal-line bg-terminal-panel2/60 p-3">
              <p className="text-xs text-terminal-muted">${bid.stake.toFixed(2)} mock stake</p>
              <p className="text-xs font-semibold text-terminal-text">
                {bid.limitPrice ? formatPriceCents(bid.limitPrice) : formatProbability(bid.probabilityAtBid)} / $
                {bid.potentialReturn.toFixed(2)}
              </p>
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
