"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MarketDataMeta } from "../../data/providers/types";
import { getMarketDataSourceLabel } from "../../data/providers/source";
import type {
  ApiFootballDataIssue,
  ApiFootballFixtureContext,
  ApiFootballInjuryContext,
  ApiFootballOddContext,
  ApiFootballSquadPlayer,
  ApiFootballStandingContext,
  ApiFootballTeamProfile,
  NewsEvent,
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
} from "../../types/market";
import { readStoredWatchlist, writeStoredWatchlist } from "../../lib/storage/local-terminal";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getSentimentLabel,
} from "../home/market-formatters";
import { TeamFlag } from "../teams/TeamFlag";
import { WalletMenuButton } from "../trading/WalletMenuButton";

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

interface StrengthMetric {
  label: string;
  value: number;
}

interface KeyPlayerView {
  name: string;
  number?: number;
  position: string;
  expectedMinutes: number;
  squadProbability: number;
  formScore: number;
  injuryStatus: string;
  topMarket: string;
}

interface RecentMatchView {
  id: string;
  date: string;
  opponent: string;
  status: string;
  result: string;
  score: string;
  note: string;
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
  const strength = getStrengthMetrics(snapshot, footballSquad, footballInjuries, footballStandings, relatedNews);
  const keyPlayers = getKeyPlayers(footballSquad, footballInjuries, snapshot);
  const recentMatches = getRecentMatches(footballFixtures, snapshot);
  const upcomingFixture = getNextFixture(footballFixtures);
  const bidHref = `/bid?team=${team.id}`;

  return (
    <main className="prophet-html">
      <div className="page team-detail-page">
        <TeamDetailTopbar />

        <TeamHero
          snapshot={snapshot}
          profile={footballProfile}
          relatedNewsCount={relatedNews.length}
          bidHref={bidHref}
        />

        <div className="team-detail-grid">
          <div className="team-detail-main">
            <section className="team-detail-two-up">
              <ProbabilityPanel history={probabilityHistory} snapshot={snapshot} />
              <StrengthPanel metrics={strength} />
            </section>

            <LineupPanel squad={footballSquad} injuries={footballInjuries} dataIssues={footballDataIssues} />
            <KeyPlayersPanel players={keyPlayers} />
            <RecentMatchesPanel matches={recentMatches} />
            <NewsSignalsPanel news={relatedNews} snapshot={snapshot} />
          </div>

          <aside className="team-detail-sidebar">
            <TradeEntryPanel snapshot={snapshot} bidHref={bidHref} />
            <RelatedMarketsPanel snapshot={snapshot} odds={footballOdds} />
            <MarketIntelligencePanel
              snapshot={snapshot}
              history={probabilityHistory}
              source={dataStatus.source}
              dataStatus={dataStatus}
              relatedNewsCount={relatedNews.length}
            />
            <NextMatchPanel fixture={upcomingFixture} snapshot={snapshot} />
            <WatchlistPanel teamId={team.id} teamName={team.name} />
          </aside>
        </div>

        <div className="team-detail-footnote">
          <span>Source: {getMarketDataSourceLabel(dataStatus.source)} market data, API-Football team context, and GDELT news matching when available.</span>
          <span>All probability, payout, and signal views are analytical context only.</span>
        </div>
      </div>
    </main>
  );
}

function TeamDetailTopbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/markets">Markets</Link>
        <Link href="/matches">Matches</Link>
        <Link href="/teams" aria-current="page">Teams</Link>
        <Link href="/portfolio">Portfolio</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}

function TeamHero({
  snapshot,
  profile,
  relatedNewsCount,
  bidHref,
}: {
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  relatedNewsCount: number;
  bidHref: string;
}) {
  const { team, market } = snapshot;
  const isDown = market.change24h < 0;

  return (
    <section className="team-detail-hero">
      <div className="team-detail-breadcrumb">
        <Link href="/teams">Teams</Link>
        <span>/</span>
        <span>{team.name}</span>
      </div>

      <div className="team-detail-hero-card">
        <div className="team-detail-identity">
          {profile?.logoUrl ? (
            <img className="team-detail-crest" src={profile.logoUrl} alt={`${team.name} crest`} />
          ) : (
            <TeamFlag code={team.code} name={team.name} className="team-detail-flag" />
          )}
          <div>
            <h1>{team.name}</h1>
            <p>
              {team.fifaRank ? `FIFA Ranking #${team.fifaRank}` : "FIFA ranking pending"}
              {team.group ? ` / Group ${team.group}` : ""}
            </p>
            <div className="team-detail-tags">
              <span>Market momentum</span>
              <strong className={isDown ? "down" : ""}>{isDown ? "Falling" : "Rising"}</strong>
              <span>{relatedNewsCount > 0 ? `${relatedNewsCount} news signals` : "No news signal"}</span>
            </div>
          </div>
        </div>

        <div className="team-detail-hero-metrics">
          <HeroMetric label="Winner probability" value={formatProbability(market.probability)} />
          <HeroMetric label="24h change" value={formatChange(market.change24h)} tone={market.change24h < 0 ? "down" : "up"} />
          <HeroMetric label="7d change" value={formatChange(market.change7d)} tone={market.change7d < 0 ? "down" : "up"} />
          <HeroMetric label="Market volume" value={formatVolume(market.volume)} />
        </div>

        <div className="team-detail-hero-actions">
          <Link className="market-quick-bid" href={bidHref}>
            Place Bid
          </Link>
          <span className="team-detail-favorite" aria-label="Watchlist shortcut">☆</span>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className={tone === "down" ? "team-hero-metric down" : tone === "up" ? "team-hero-metric up" : "team-hero-metric"}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ProbabilityPanel({ history, snapshot }: { history: ProbabilityHistoryPoint[]; snapshot: TeamMarketSnapshot }) {
  const chartData = history.length > 0 ? history : buildFallbackHistory(snapshot);
  const low = Math.min(...chartData.map((point) => point.probability));
  const high = Math.max(...chartData.map((point) => point.probability));
  const latest = chartData.at(-1)?.probability ?? snapshot.market.probability;

  return (
    <section className="panel team-detail-panel probability-panel">
      <div className="panel-head">
        <h2 className="panel-title">Winner Probability Over Time</h2>
        <div className="team-detail-tabs" aria-label="Probability range">
          <span>24H</span>
          <strong>7D</strong>
          <span>30D</span>
        </div>
      </div>
      <div className="team-probability-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="team-detail-probability-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#125afc" stopOpacity={0.26} />
                <stop offset="95%" stopColor="#20c2e4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e3edf8" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#71809a", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={22} />
            <YAxis tick={{ fill: "#71809a", fontSize: 10 }} tickFormatter={(value: number) => `${Number(value).toFixed(1)}%`} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #dce8f5", borderRadius: 7, color: "#07142d" }}
              formatter={(value: number) => [formatProbability(value), "Probability"]}
            />
            <Area type="monotone" dataKey="probability" stroke="#125afc" strokeWidth={2} fill="url(#team-detail-probability-fill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="team-detail-mini-grid two">
        <PanelMetric label="Range low" value={formatProbability(low)} />
        <PanelMetric label="Latest" value={formatProbability(latest)} />
        <PanelMetric label="Range high" value={formatProbability(high)} />
      </div>
    </section>
  );
}

function StrengthPanel({ metrics }: { metrics: StrengthMetric[] }) {
  const score = Math.round(metrics.reduce((sum, item) => sum + item.value, 0) / metrics.length);

  return (
    <section className="panel team-detail-panel strength-panel">
      <div className="panel-head">
        <h2 className="panel-title">Team Strength</h2>
        <span className="live">Model view</span>
      </div>
      <div className="team-strength-chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={metrics} outerRadius="74%">
            <PolarGrid stroke="#dce8f5" />
            <PolarAngleAxis dataKey="label" tick={{ fill: "#526078", fontSize: 10 }} />
            <Radar dataKey="value" stroke="#125afc" fill="#125afc" fillOpacity={0.26} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="strength-score">
        <span>Strength Score</span>
        <strong>{score}</strong>
        <small>/100</small>
      </div>
    </section>
  );
}

function LineupPanel({
  squad,
  injuries,
  dataIssues,
}: {
  squad: ApiFootballSquadPlayer[];
  injuries: ApiFootballInjuryContext[];
  dataIssues: ApiFootballDataIssue[];
}) {
  const starters = getLineupPlayers(squad);
  const bench = squad.filter((player) => !starters.some((starter) => starter.playerId === player.playerId)).slice(0, 7);
  const hasSquad = squad.length > 0;

  return (
    <section className="panel team-detail-panel lineup-panel">
      <div className="panel-head">
        <h2 className="panel-title">Expected Starting XI</h2>
        <span className="view-all">{hasSquad ? "API-Football squad" : getIssueMessage(dataIssues, "squad") ?? "Pending"}</span>
      </div>

      {hasSquad ? (
        <div className="lineup-layout">
          <div className="pitch">
            {starters.map((player, index) => (
              <div key={player.playerId} className={`pitch-player slot-${index + 1}`}>
                <PlayerAvatar player={player} />
                <strong>{shortenName(player.name)}</strong>
                <span>{player.position ?? "Player"}</span>
              </div>
            ))}
          </div>
          <div className="bench-list">
            <h3>Bench</h3>
            {bench.length > 0 ? (
              bench.map((player) => (
                <MiniPlayerRow key={player.playerId} player={player} />
              ))
            ) : (
              <p>No bench players stored yet.</p>
            )}
            <h3>Doubtful / Out</h3>
            {injuries.length > 0 ? (
              injuries.slice(0, 4).map((injury) => (
                <div key={`${injury.playerName}-${injury.reason ?? "injury"}`} className="bench-row down">
                  <span>{injury.playerName}</span>
                  <strong>{injury.reason ?? "Injury"}</strong>
                </div>
              ))
            ) : (
              <p>No injury signal stored.</p>
            )}
          </div>
        </div>
      ) : (
        <EmptyPanel title="Starting XI pending" body={getIssueMessage(dataIssues, "squad") ?? "Squad data has not been attached for this team yet."} />
      )}
    </section>
  );
}

function KeyPlayersPanel({ players }: { players: KeyPlayerView[] }) {
  return (
    <section className="panel team-detail-panel key-players-panel">
      <div className="panel-head">
        <h2 className="panel-title">Key Players</h2>
        <span className="view-all">View all</span>
      </div>
      <div className="key-player-grid">
        {players.map((player) => (
          <article key={player.name} className="key-player-card">
            <div className="key-player-head">
              <div className="player-avatar fallback">{getInitials(player.name)}</div>
              <div>
                <h3>{player.name}</h3>
                <p>{player.position}{player.number ? ` / #${player.number}` : ""}</p>
              </div>
            </div>
            <PlayerMetric label="Expected minutes" value={`${player.expectedMinutes}%`} />
            <PlayerMetric label="Squad probability" value={`${player.squadProbability}%`} />
            <PlayerMetric label="Form score" value={String(player.formScore)} />
            <PlayerMetric label="Injury status" value={player.injuryStatus} tone={player.injuryStatus === "Risk" ? "down" : "up"} />
            <div className="key-player-market">
              <span>Top market</span>
              <strong>{player.topMarket}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentMatchesPanel({ matches }: { matches: RecentMatchView[] }) {
  return (
    <section className="panel team-detail-panel recent-matches-panel">
      <div className="panel-head">
        <h2 className="panel-title">Recent Matches</h2>
        <span className="view-all">View all</span>
      </div>
      <div className="recent-match-table">
        <div className="recent-match-row head">
          <span>Date</span>
          <span>Opponent</span>
          <span>Result</span>
          <span>Score</span>
          <span>Key note</span>
        </div>
        {matches.map((match) => (
          <div key={match.id} className="recent-match-row">
            <span>{match.date}</span>
            <strong>{match.opponent}</strong>
            <b className={match.result === "W" ? "up" : match.result === "L" ? "down" : ""}>{match.result}</b>
            <span>{match.score}</span>
            <p>{match.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function NewsSignalsPanel({
  news,
  snapshot,
}: {
  news: NewsEvent[];
  snapshot: TeamMarketSnapshot;
}) {
  const signals = news.length > 0 ? news.slice(0, 4) : buildFallbackNewsSignals(snapshot);

  return (
    <section className="panel team-detail-panel news-signals-panel">
      <div className="panel-head">
        <h2 className="panel-title">News-to-Market Signals</h2>
        <Link className="view-all" href="/feed">View all</Link>
      </div>
      <div className="news-signal-grid">
        {signals.map((item) => (
          <article key={item.id} className="news-signal-card">
            <span className={item.impactScore < 0 ? "signal-dot down" : "signal-dot"} />
            <h3>{item.headline}</h3>
            <p>{item.summary}</p>
            <SignalMeta label="Source" value={item.source} />
            <SignalMeta label="Impact" value={formatImpact(item.impactScore)} tone={item.impactScore < 0 ? "down" : "up"} />
            <SignalMeta label="Confidence" value={item.matchedKeywords?.length ? "Medium" : "Low"} />
          </article>
        ))}
      </div>
    </section>
  );
}

function TradeEntryPanel({ snapshot, bidHref }: { snapshot: TeamMarketSnapshot; bidHref: string }) {
  const yesPrice = snapshot.market.probability;
  const noPrice = Math.max(0, 100 - yesPrice);

  return (
    <section className="panel team-detail-panel trade-entry-panel">
      <div className="panel-head">
        <h2 className="panel-title">Place a Bid</h2>
        <span className="view-all">User-owned flow</span>
      </div>
      <div className="trade-entry-market">
        <span>Market</span>
        <strong>{snapshot.team.name} to win World Cup</strong>
        <small>Winner</small>
      </div>
      <div className="trade-outcomes">
        <span className="active">YES {formatProbability(yesPrice)}</span>
        <span>NO {formatProbability(noPrice)}</span>
      </div>
      <div className="team-detail-mini-grid">
        <PanelMetric label="Reference price" value={`${yesPrice.toFixed(1)}c`} />
        <PanelMetric label="Min order" value={snapshot.market.polymarket?.minOrderSize ? `$${snapshot.market.polymarket.minOrderSize}` : "Pending"} />
        <PanelMetric label="Accepting orders" value={snapshot.market.polymarket?.acceptingOrders ? "Yes" : "Pending"} />
      </div>
      <Link className="bid-button full" href={bidHref}>
        Review Bid
      </Link>
      <p>Wallet connection, eligibility, balance, allowance, signature, and confirmation happen in the bid flow.</p>
    </section>
  );
}

function RelatedMarketsPanel({
  snapshot,
  odds,
}: {
  snapshot: TeamMarketSnapshot;
  odds: ApiFootballOddContext[];
}) {
  const rows = [
    {
      market: `${snapshot.team.name} to win World Cup`,
      probability: snapshot.market.probability,
      change: snapshot.market.change24h,
      volume: snapshot.market.volume,
    },
    {
      market: `${snapshot.team.name} market depth`,
      probability: snapshot.market.liquidity ? Math.min(99, snapshot.market.probability + 6) : snapshot.market.probability,
      change: snapshot.market.change7d,
      volume: snapshot.market.liquidity ?? 0,
    },
    {
      market: odds[0]?.marketName ?? "Bookmaker comparison",
      probability: snapshot.market.bookmakerImpliedProbability,
      change: snapshot.market.probability - snapshot.market.bookmakerImpliedProbability,
      volume: snapshot.market.volume24h ?? 0,
    },
  ];

  return (
    <section className="panel team-detail-panel related-markets-panel">
      <div className="panel-head">
        <h2 className="panel-title">Related Markets</h2>
        <Link className="view-all" href="/markets">View all</Link>
      </div>
      <div className="related-market-list">
        {rows.map((row) => (
          <Link key={row.market} className="related-market-row" href={`/bid?team=${snapshot.team.id}`}>
            <span>{row.market}</span>
            <strong>{formatProbability(row.probability)}</strong>
            <small className={row.change < 0 ? "down" : ""}>{formatChange(row.change)}</small>
            <b>{row.volume > 0 ? formatVolume(row.volume) : "Pending"}</b>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MarketIntelligencePanel({
  snapshot,
  history,
  source,
  dataStatus,
  relatedNewsCount,
}: {
  snapshot: TeamMarketSnapshot;
  history: ProbabilityHistoryPoint[];
  source: MarketDataMeta["source"];
  dataStatus: MarketDataMeta;
  relatedNewsCount: number;
}) {
  const mismatch = snapshot.market.probability - snapshot.market.bookmakerImpliedProbability;
  const chartData = history.length > 0 ? history : buildFallbackHistory(snapshot);

  return (
    <section className="panel team-detail-panel intelligence-panel">
      <div className="panel-head">
        <h2 className="panel-title">Market Intelligence</h2>
        <span className="live">{getMarketDataSourceLabel(source)}</span>
      </div>
      <div className="intelligence-grid">
        <PanelMetric label="Winner probability" value={formatProbability(snapshot.market.probability)} />
        <PanelMetric label="24h change" value={formatChange(snapshot.market.change24h)} tone={snapshot.market.change24h < 0 ? "down" : "up"} />
        <PanelMetric label="7d change" value={formatChange(snapshot.market.change7d)} tone={snapshot.market.change7d < 0 ? "down" : "up"} />
        <PanelMetric label="Market volume" value={formatVolume(snapshot.market.volume)} />
        <PanelMetric label="Liquidity" value={snapshot.market.liquidity ? formatVolume(snapshot.market.liquidity) : "Pending"} />
        <PanelMetric label="Sentiment" value={getSentimentLabel(snapshot.market.sentiment)} />
        <PanelMetric label="Odds spread" value={formatChange(mismatch)} tone={mismatch < 0 ? "down" : "up"} />
        <PanelMetric label="News signals" value={String(relatedNewsCount)} />
        <PanelMetric label="Updated" value={formatShortDate(dataStatus.lastUpdated)} />
      </div>
      <div className="intelligence-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <Area type="monotone" dataKey="probability" stroke="#125afc" strokeWidth={2} fill="#125afc" fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="why-it-moved">
        <span>Why it moved</span>
        <p>{getMovementNarrative(snapshot, relatedNewsCount)}</p>
      </div>
    </section>
  );
}

function NextMatchPanel({
  fixture,
  snapshot,
}: {
  fixture?: ApiFootballFixtureContext;
  snapshot: TeamMarketSnapshot;
}) {
  return (
    <section className="panel team-detail-panel next-match-panel">
      <div className="panel-head">
        <h2 className="panel-title">Next Match</h2>
      </div>
      {fixture ? (
        <>
          <div className="next-match-teams">
            <div>
              <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
              <strong>{snapshot.team.name}</strong>
            </div>
            <span>vs</span>
            <div>
              {fixture.opponentLogoUrl ? <img src={fixture.opponentLogoUrl} alt="" /> : <span className="flag">{fixture.opponentName.slice(0, 2)}</span>}
              <strong>{fixture.opponentName}</strong>
            </div>
          </div>
          <p>{formatFixtureDate(fixture.kickoffAt)}{fixture.venueName ? ` / ${fixture.venueName}` : ""}</p>
          <Link className="market-detail-button" href="/matches">
            View Match
          </Link>
        </>
      ) : (
        <EmptyPanel title="Next match pending" body="Upcoming fixture data is not attached for this team yet." />
      )}
    </section>
  );
}

function WatchlistPanel({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    setIsWatching(readStoredWatchlist().includes(teamId));
  }, [teamId]);

  function toggleWatchlist() {
    const ids = readStoredWatchlist();
    const nextIds = ids.includes(teamId) ? ids.filter((id) => id !== teamId) : [teamId, ...ids];

    writeStoredWatchlist(nextIds);
    setIsWatching(nextIds.includes(teamId));
  }

  return (
    <section className="panel team-detail-panel watchlist-panel">
      <div>
        <span>Watchlist</span>
        <h2>{teamName}</h2>
        <p>Track this team locally and surface it on the watchlist board.</p>
      </div>
      <button type="button" onClick={toggleWatchlist}>
        {isWatching ? "Watching" : "Add to Watchlist"}
      </button>
    </section>
  );
}

function PanelMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className={tone === "down" ? "detail-metric down" : tone === "up" ? "detail-metric up" : "detail-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlayerMetric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className={tone === "down" ? "player-metric down" : tone === "up" ? "player-metric up" : "player-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SignalMeta({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className={tone === "down" ? "signal-meta down" : tone === "up" ? "signal-meta up" : "signal-meta"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlayerAvatar({ player }: { player: ApiFootballSquadPlayer }) {
  if (player.photoUrl) {
    return <img className="player-avatar" src={player.photoUrl} alt={player.name} />;
  }

  return <span className="player-avatar fallback">{getInitials(player.name)}</span>;
}

function MiniPlayerRow({ player }: { player: ApiFootballSquadPlayer }) {
  return (
    <div className="bench-row">
      <span>{player.number ? `${player.number}` : "-"}</span>
      <strong>{player.name}</strong>
      <small>{player.position ?? "Player"}</small>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-detail-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function getStrengthMetrics(
  snapshot: TeamMarketSnapshot,
  squad: ApiFootballSquadPlayer[],
  injuries: ApiFootballInjuryContext[],
  standings: ApiFootballStandingContext[],
  news: NewsEvent[],
): StrengthMetric[] {
  const rankBase = snapshot.team.fifaRank ? Math.max(64, 99 - snapshot.team.fifaRank * 1.2) : 76;
  const attack = clampScore(rankBase + snapshot.market.probability * 0.16);
  const midfield = clampScore(rankBase - 2 + squad.length * 0.18);
  const defense = clampScore(rankBase - injuries.length * 3);
  const form = clampScore(76 + (standings[0]?.wins ?? 2) * 3 + snapshot.market.change7d);
  const depth = clampScore(68 + Math.min(18, squad.length * 0.7) - injuries.length * 1.4);
  const momentum = clampScore(72 + snapshot.market.change24h * 3 + news.length * 1.5);

  return [
    { label: "Attack", value: attack },
    { label: "Midfield", value: midfield },
    { label: "Defense", value: defense },
    { label: "Form", value: form },
    { label: "Depth", value: depth },
    { label: "Momentum", value: momentum },
  ];
}

function getKeyPlayers(
  squad: ApiFootballSquadPlayer[],
  injuries: ApiFootballInjuryContext[],
  snapshot: TeamMarketSnapshot,
): KeyPlayerView[] {
  const injuryNames = new Set(injuries.map((injury) => injury.playerName.toLowerCase()));
  const sourcePlayers = squad.length > 0
    ? squad.slice(0, 5)
    : buildFallbackPlayers(snapshot.team.name);

  return sourcePlayers.map((player, index) => {
    const injured = injuryNames.has(player.name.toLowerCase());

    return {
      name: player.name,
      number: player.number,
      position: player.position ?? "Player",
      expectedMinutes: Math.max(54, 88 - index * 5 - (injured ? 22 : 0)),
      squadProbability: Math.max(64, 96 - index * 4 - (injured ? 20 : 0)),
      formScore: Math.max(70, Math.round(82 + snapshot.market.change7d - index * 2)),
      injuryStatus: injured ? "Risk" : "Fit",
      topMarket: index % 2 === 0 ? "To Win Group" : "To Score",
    };
  });
}

function getLineupPlayers(squad: ApiFootballSquadPlayer[]): ApiFootballSquadPlayer[] {
  if (squad.length === 0) {
    return [];
  }

  const ordered = [
    ...squad.filter((player) => player.position?.toLowerCase().includes("attacker")),
    ...squad.filter((player) => player.position?.toLowerCase().includes("midfielder")),
    ...squad.filter((player) => player.position?.toLowerCase().includes("defender")),
    ...squad.filter((player) => player.position?.toLowerCase().includes("goalkeeper")),
    ...squad,
  ];
  const unique = new Map<number, ApiFootballSquadPlayer>();

  for (const player of ordered) {
    unique.set(player.playerId, player);
  }

  return [...unique.values()].slice(0, 11);
}

function getRecentMatches(fixtures: ApiFootballFixtureContext[], snapshot: TeamMarketSnapshot): RecentMatchView[] {
  const finished = fixtures.filter((fixture) => fixture.status === "finished").slice(0, 5);

  if (finished.length > 0) {
    return finished.map((fixture) => ({
      id: String(fixture.fixtureId),
      date: formatShortDate(fixture.kickoffAt),
      opponent: fixture.opponentName,
      status: fixture.status,
      result: "D",
      score: "Stored",
      note: fixture.leagueName ?? "Fixture result stored from API-Football.",
    }));
  }

  return [
    {
      id: "market-form-1",
      date: "Latest",
      opponent: "Market window",
      status: "market",
      result: snapshot.market.change24h >= 0 ? "W" : "L",
      score: formatChange(snapshot.market.change24h),
      note: "Market probability changed over the last reported window.",
    },
    {
      id: "market-form-2",
      date: "7D",
      opponent: "Market trend",
      status: "market",
      result: snapshot.market.change7d >= 0 ? "W" : "L",
      score: formatChange(snapshot.market.change7d),
      note: "Seven-day movement is used when match results are pending.",
    },
  ];
}

function getNextFixture(fixtures: ApiFootballFixtureContext[]): ApiFootballFixtureContext | undefined {
  return [...fixtures]
    .filter((fixture) => fixture.status === "scheduled")
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))[0];
}

function buildFallbackHistory(snapshot: TeamMarketSnapshot): ProbabilityHistoryPoint[] {
  const base = snapshot.market.probability;

  return Array.from({ length: 8 }, (_, index) => {
    const offset = index - 7;
    const value = base - snapshot.market.change7d + (snapshot.market.change7d / 7) * index + Math.sin(index) * 0.4;

    return {
      teamId: snapshot.team.id,
      date: offset === 0 ? "Now" : `${Math.abs(offset)}d`,
      probability: Number(Math.max(0.1, Math.min(99.9, value)).toFixed(1)),
    };
  });
}

function buildFallbackPlayers(teamName: string): ApiFootballSquadPlayer[] {
  return ["Captain", "Forward", "Midfielder", "Defender", "Goalkeeper"].map((role, index) => ({
    playerId: index + 1,
    name: `${teamName} ${role}`,
    number: index + 1,
    position: role,
  }));
}

function buildFallbackNewsSignals(snapshot: TeamMarketSnapshot): NewsEvent[] {
  return [
    {
      id: "volume-signal",
      teamId: snapshot.team.id,
      headline: "Volume Spike",
      source: "Market tape",
      publishedAt: snapshot.market.updatedAt,
      impactScore: snapshot.market.change24h,
      summary: `${snapshot.team.name} market volume is ${formatVolume(snapshot.market.volume)} with ${formatChange(snapshot.market.change24h)} over 24h.`,
    },
    {
      id: "momentum-signal",
      teamId: snapshot.team.id,
      headline: "Narrative Momentum",
      source: "Probability model",
      publishedAt: snapshot.market.updatedAt,
      impactScore: snapshot.market.change7d,
      summary: `Seven-day probability move is ${formatChange(snapshot.market.change7d)}.`,
    },
  ];
}

function getMovementNarrative(snapshot: TeamMarketSnapshot, relatedNewsCount: number): string {
  const direction = snapshot.market.change24h >= 0 ? "rose" : "fell";
  const newsCopy = relatedNewsCount > 0
    ? `${relatedNewsCount} related news item${relatedNewsCount === 1 ? "" : "s"} are attached.`
    : "No qualifying news item is attached yet.";

  return `${snapshot.team.name} probability ${direction} ${formatChange(Math.abs(snapshot.market.change24h))} in the latest window. ${newsCopy} This is correlation context, not causation.`;
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

function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatImpact(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function shortenName(name: string): string {
  const parts = name.split(" ");

  if (parts.length <= 2) {
    return name;
  }

  return `${parts[0][0]}. ${parts.at(-1)}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function clampScore(value: number): number {
  return Math.round(Math.max(45, Math.min(98, value)));
}
