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
import type { NormalizedBookmakerOdds } from "../../data/odds/types";
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
  OrderOutcomeSide,
  ProbabilityHistoryPoint,
  TeamFootballMetadata,
  TeamKeyPlayer,
  TeamMarketSnapshot,
  TradingUserSession,
  UserOrderPreview,
  UserFavourite,
  UserTradingReadiness,
} from "../../types/market";
import { buildBidOrderPreview } from "../../lib/market/polymarketOrder";
import { calculateReferencePrice, formatPriceCents, formatShareSize } from "../../lib/market/orderMath";
import { attachUserOrderSignature, buildUserOrderSignablePayload } from "../../lib/market/userOrder";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getSentimentLabel,
} from "../home/market-formatters";
import { TeamFlag } from "../teams/TeamFlag";
import {
  connectTradingWallet,
  formatShortWalletAddress,
  loadTradingSession,
} from "../trading/tradingWalletSession";
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
  outrightOdds: NormalizedBookmakerOdds[];
  footballDataIssues: ApiFootballDataIssue[];
  footballMetadata?: TeamFootballMetadata;
  allFootballMetadata: TeamFootballMetadata[];
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
  club?: string;
  note?: string;
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

type KeyPlayerSource = ApiFootballSquadPlayer & {
  club?: string;
  note?: string;
};

type TradeTicketStatus = "idle" | "loading" | "signing" | "submitting" | "success" | "error";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
}

interface TradingConfig {
  builderCode?: string;
  builderTakerFeeRate?: number;
}

interface TypedDataPayload {
  domain: unknown;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
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
  outrightOdds,
  footballDataIssues,
  footballMetadata,
  allFootballMetadata,
  dataStatus,
}: TeamDetailPageProps) {
  const { team, market } = snapshot;
  const strength = getStrengthMetrics(snapshot, footballMetadata, footballSquad, footballInjuries, footballStandings, relatedNews);
  const keyPlayers = getKeyPlayers(footballMetadata, footballSquad, footballInjuries, snapshot);
  const recentMatches = getRecentMatches(footballFixtures);
  const upcomingFixture = getNextFixture(footballFixtures);

  return (
    <main className="prophet-html">
      <div className="page team-detail-page">
        <TeamDetailTopbar />

        <TeamHero
          snapshot={snapshot}
          profile={footballProfile}
          metadata={footballMetadata}
        />

        <section className="team-dossier-strip" aria-label="Football dossier quick scan">
          <RecentFormCard matches={recentMatches} />
          <NextFixtureCard fixture={upcomingFixture} snapshot={snapshot} />
          <GroupContextCard metadata={footballMetadata} allMetadata={allFootballMetadata} />
          <KeyStarsCard players={keyPlayers} metadata={footballMetadata} />
        </section>

        <div className="team-detail-grid">
          <div className="team-detail-main">
            <section className="team-detail-two-up">
              <StrengthPanel metrics={strength} />
              <OddsComparisonPanel snapshot={snapshot} fixtureOdds={footballOdds} outrightOdds={outrightOdds} dataStatus={dataStatus} />
            </section>

            <RecentMatchesPanel matches={recentMatches} />
            <LineupPanel squad={footballSquad} injuries={footballInjuries} dataIssues={footballDataIssues} />
            <KeyPlayersPanel players={keyPlayers} />
            <NewsSignalsPanel news={relatedNews} snapshot={snapshot} />
          </div>

          <aside className="team-detail-sidebar">
            <NextMatchPanel fixture={upcomingFixture} snapshot={snapshot} />
            <TradeEntryPanel snapshot={snapshot} />
            <ProbabilityPanel history={probabilityHistory} snapshot={snapshot} />
            <MarketIntelligencePanel
              snapshot={snapshot}
              history={probabilityHistory}
              source={dataStatus.source}
              dataStatus={dataStatus}
              relatedNewsCount={relatedNews.length}
            />
            <WatchlistPanel teamId={team.id} teamName={team.name} />
          </aside>
        </div>

        <div className="team-detail-footnote">
          <span>Source: curated football metadata, API-Football team context, GDELT news, The Odds API, and {getMarketDataSourceLabel(dataStatus.source)} market data.</span>
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
        <Link href="/search">Search</Link>
        <Link href="/portfolio">Portfolio</Link>
      </nav>
      <WalletMenuButton />
    </header>
  );
}

function TeamHero({
  snapshot,
  profile,
  metadata,
}: {
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  metadata?: TeamFootballMetadata;
}) {
  const { team } = snapshot;
  const fifaRank = metadata?.fifaRank ?? team.fifaRank;

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
              {fifaRank ? `FIFA Ranking #${fifaRank}` : "FIFA ranking pending"}
              {metadata?.group && metadata.group !== "Pending" ? ` / Group ${metadata.group}` : " / Group pending"}
            </p>
            <div className="team-detail-tags">
              <span>{metadata?.worldCupBestFinish ?? "World Cup history pending"}</span>
              <strong>{metadata?.worldCupTitles ? `${metadata.worldCupTitles} titles` : "No titles"}</strong>
              <span>{metadata ? `${metadata.status} metadata` : "Metadata pending"}</span>
            </div>
          </div>
        </div>

        <div className="team-detail-hero-metrics">
          <HeroMetric label="FIFA rank" value={fifaRank ? `#${fifaRank}` : "Pending"} />
          <HeroMetric label="Squad value" value={formatSquadValue(metadata)} />
          <HeroMetric label="Best finish" value={metadata?.worldCupBestFinish ?? "Pending"} />
          <HeroMetric label="Group" value={metadata?.group && metadata.group !== "Pending" ? `Group ${metadata.group}` : "Pending"} />
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

function RecentFormCard({ matches }: { matches: RecentMatchView[] }) {
  return (
    <section className="panel team-dossier-card">
      <div className="panel-head">
        <h2 className="panel-title">Recent Form</h2>
        <span className="live">Last 5</span>
      </div>
      {matches.length > 0 ? (
        <>
          <div className="form-strip large">
            {matches.map((match) => (
              <span key={match.id} className={match.result === "W" ? "win" : match.result === "L" ? "loss" : "draw"}>
                {match.result}
              </span>
            ))}
          </div>
          <p>{matches[0]?.opponent ? `Latest: ${matches[0].result} vs ${matches[0].opponent}, ${matches[0].score}` : "Recent results loaded."}</p>
        </>
      ) : (
        <EmptyPanel title="No recent result data" body="API-Football has not attached finished fixtures for this team yet." />
      )}
    </section>
  );
}

function NextFixtureCard({
  fixture,
  snapshot,
}: {
  fixture?: ApiFootballFixtureContext;
  snapshot: TeamMarketSnapshot;
}) {
  return (
    <section className="panel team-dossier-card">
      <div className="panel-head">
        <h2 className="panel-title">Next Fixture</h2>
        <span className="live">{fixture?.isWorldCupFixture ? "World Cup" : "Schedule"}</span>
      </div>
      {fixture ? (
        <div className="dossier-fixture">
          <div>
            <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
            <strong>{snapshot.team.code}</strong>
          </div>
          <span>{fixture.homeAway === "away" ? "at" : "vs"}</span>
          <div>
            {fixture.opponentLogoUrl ? <img src={fixture.opponentLogoUrl} alt="" /> : <b>{fixture.opponentName.slice(0, 3)}</b>}
            <strong>{fixture.opponentName}</strong>
          </div>
          <p>{formatFixtureDate(fixture.kickoffAt)}{fixture.venueName ? ` / ${fixture.venueName}` : ""}</p>
        </div>
      ) : (
        <EmptyPanel title="No official fixture" body="Upcoming fixture data is pending for this team." />
      )}
    </section>
  );
}

function GroupContextCard({
  metadata,
  allMetadata,
}: {
  metadata?: TeamFootballMetadata;
  allMetadata: TeamFootballMetadata[];
}) {
  const peers = getGroupPeerMetadata(metadata, allMetadata);

  return (
    <section className="panel team-dossier-card">
      <div className="panel-head">
        <h2 className="panel-title">Group Context</h2>
        <span className="live">{metadata?.group && metadata.group !== "Pending" ? `Group ${metadata.group}` : "Pending"}</span>
      </div>
      {metadata?.group && metadata.group !== "Pending" ? (
        <div className="group-peer-list">
          <strong>{peers.length > 0 ? `${peers.length} listed peers` : "Peers pending"}</strong>
          {peers.slice(0, 3).map((peer) => (
            <span key={peer.teamId}>
              {peer.teamId.replace(/-/g, " ")}
              {peer.fifaRank ? ` / #${peer.fifaRank}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <EmptyPanel title="Group pending" body="Official or curated group context is not attached yet." />
      )}
    </section>
  );
}

function KeyStarsCard({
  players,
  metadata,
}: {
  players: KeyPlayerView[];
  metadata?: TeamFootballMetadata;
}) {
  return (
    <section className="panel team-dossier-card">
      <div className="panel-head">
        <h2 className="panel-title">Key Stars</h2>
        <span className="live">{metadata?.source ? "Curated" : "Pending"}</span>
      </div>
      <div className="dossier-star-list">
        {players.slice(0, 3).map((player) => (
          <div key={player.name} className="dossier-star-row">
            <div className="player-avatar fallback">{getInitials(player.name)}</div>
            <div>
              <strong>{player.name}</strong>
              <span>{player.position}{player.club ? ` / ${player.club}` : ""}</span>
            </div>
          </div>
        ))}
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

function OddsComparisonPanel({
  snapshot,
  fixtureOdds,
  outrightOdds,
  dataStatus,
}: {
  snapshot: TeamMarketSnapshot;
  fixtureOdds: ApiFootballOddContext[];
  outrightOdds: NormalizedBookmakerOdds[];
  dataStatus: MarketDataMeta;
}) {
  const visibleFixtureOdds = fixtureOdds.slice(0, 6);
  const visibleOutrightOdds = outrightOdds.slice(0, 5);
  const spread = snapshot.market.probability - snapshot.market.bookmakerImpliedProbability;
  const impliedValues = outrightOdds.map((item) => item.impliedProbability).sort((a, b) => a - b);
  const min = impliedValues[0];
  const max = impliedValues.at(-1);

  return (
    <section className="panel team-detail-panel odds-comparison-panel">
      <div className="panel-head">
        <h2 className="panel-title">Odds Comparison</h2>
        <span className="live">{dataStatus.odds?.source === "the-odds-api" ? "The Odds API" : "Odds pending"}</span>
      </div>
      <div className="team-detail-mini-grid">
        <PanelMetric label="Outright odds implied" value={formatProbability(snapshot.market.bookmakerImpliedProbability)} />
        <PanelMetric label="Market probability" value={formatProbability(snapshot.market.probability)} />
        <PanelMetric label="Difference" value={formatChange(spread)} tone={spread < 0 ? "down" : "up"} />
        <PanelMetric label="Bookmaker spread" value={min !== undefined && max !== undefined ? `${formatProbability(min)} - ${formatProbability(max)}` : "Unavailable"} />
      </div>
      <div className="fixture-odds-list">
        {visibleOutrightOdds.length > 0 ? (
          visibleOutrightOdds.map((item) => (
            <div key={`${item.bookmaker}-${item.teamId}-${item.decimalOdds}`} className="fixture-odds-row">
              <span>{item.bookmaker}</span>
              <strong>Winner outright</strong>
              <b>{formatProbability(item.impliedProbability)}</b>
            </div>
          ))
        ) : visibleFixtureOdds.length > 0 ? (
          visibleFixtureOdds.map((item) => (
            <div key={`${item.fixtureId}-${item.bookmaker ?? "book"}-${item.marketName ?? "market"}-${item.selectionName ?? "selection"}`} className="fixture-odds-row">
              <span>{item.bookmaker ?? "Bookmaker"}</span>
              <strong>{item.selectionName ?? item.marketName ?? "Fixture odds"}</strong>
              <b>{item.odd ?? "Pending"}</b>
            </div>
          ))
        ) : (
          <EmptyPanel title="Fixture odds pending" body="API-Football fixture odds are only shown when a priced upcoming match is available." />
        )}
      </div>
      <p className="odds-disclosure">Outright odds are third-party context. Fixture odds depend on available scheduled matches and bookmaker coverage.</p>
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
              <span>{player.club ? "Club" : "Profile note"}</span>
              <strong>{player.club ?? player.note ?? player.topMarket}</strong>
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
        <span className="view-all">API-Football</span>
      </div>
      {matches.length > 0 ? (
        <div className="recent-match-table">
          <div className="recent-match-row head">
            <span>Date</span>
            <span>Opponent</span>
            <span>Result</span>
            <span>Score</span>
            <span>Competition</span>
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
      ) : (
        <EmptyPanel title="No recent result data" body="Finished fixtures are not attached for this team yet. Market movement is not used as a substitute for match form." />
      )}
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
  const signals = news.length > 0 ? [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 4) : [];

  return (
    <section className="panel team-detail-panel news-signals-panel">
      <div className="panel-head">
        <h2 className="panel-title">News-to-Market Signals</h2>
        <Link className="view-all" href="/feed">View all</Link>
      </div>
      {signals.length > 0 ? (
        <div className="news-signal-grid">
          {signals.map((item) => (
            <article key={item.id} className="news-signal-card">
              <span className={item.impactScore < 0 ? "signal-dot down" : "signal-dot"} />
              <h3>{item.headline}</h3>
              <p>{item.summary}</p>
              <SignalMeta label="Source" value={item.source} />
              <SignalMeta label="Impact" value={formatImpact(item.impactScore)} tone={item.impactScore < 0 ? "down" : "up"} />
              <SignalMeta label="Published" value={formatShortDate(item.publishedAt)} />
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No related news" body={`${snapshot.team.name} has no qualifying GDELT news signal attached right now.`} />
      )}
    </section>
  );
}

function TradeEntryPanel({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const yesPrice = snapshot.market.probability;
  const noPrice = Math.max(0, 100 - yesPrice);
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [readiness, setReadiness] = useState<UserTradingReadiness | undefined>();
  const [config, setConfig] = useState<TradingConfig | undefined>();
  const [outcomeSide, setOutcomeSide] = useState<OrderOutcomeSide>("yes");
  const [amount, setAmount] = useState("25");
  const [limitPrice, setLimitPrice] = useState(() => getDefaultLimitPrice(snapshot, "yes").toFixed(3));
  const [status, setStatus] = useState<TradeTicketStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const numericAmount = Number(amount);
  const numericLimitPrice = Number(limitPrice);
  const orderAmount = Number.isFinite(numericAmount) ? Math.max(0, numericAmount) : 0;
  const orderLimitPrice = Number.isFinite(numericLimitPrice) ? numericLimitPrice : getDefaultLimitPrice(snapshot, outcomeSide);
  const preview = useMemo(
    () =>
      buildBidOrderPreview({
        snapshot,
        outcomeSide,
        tradeSide: "buy",
        amount: orderAmount,
        limitPrice: orderLimitPrice,
        orderType: "FAK",
      }),
    [orderAmount, orderLimitPrice, outcomeSide, snapshot],
  );
  const failedChecks = readiness?.checks.filter((check) => check.status === "fail") ?? [];
  const canSubmit =
    Boolean(session) &&
    readiness?.ready === true &&
    preview.canSubmitRealOrder &&
    status !== "loading" &&
    status !== "signing" &&
    status !== "submitting";

  useEffect(() => {
    let ignore = false;

    async function loadTicketState() {
      setStatus("loading");

      try {
        const [loadedSession, loadedConfig] = await Promise.all([
          loadTradingSession(),
          fetchJson<TradingConfig>("/api/trading/config"),
        ]);

        if (ignore) {
          return;
        }

        setSession(loadedSession);
        setConfig(loadedConfig);
        setStatus("idle");
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadTicketState();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadReadiness() {
      try {
        const query = new URLSearchParams({
          tradeSide: "buy",
          cost: String(preview.estimatedCost),
          size: String(preview.shareSize),
          totalCost: String(preview.estimatedTotalCost),
          estimatedTakerFee: String(preview.estimatedTakerFee),
        });

        if (preview.tokenId) {
          query.set("tokenId", preview.tokenId);
        }

        const nextReadiness = await fetchJson<UserTradingReadiness>(`/api/trading/readiness?${query.toString()}`);

        if (!ignore) {
          setReadiness(nextReadiness);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadReadiness();

    return () => {
      ignore = true;
    };
  }, [preview.estimatedCost, preview.estimatedTakerFee, preview.estimatedTotalCost, preview.shareSize, preview.tokenId]);

  async function connectWallet() {
    setStatus("loading");
    setMessage(undefined);

    try {
      const nextSession = await connectTradingWallet();
      setSession(nextSession);
      setReadiness(await loadReadinessForPreview(preview));
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function deriveCredentials() {
    if (!session) {
      return;
    }

    setStatus("signing");
    setMessage("Sign the CLOB auth message in your wallet to derive user-specific API credentials.");

    try {
      const { challenge } = await fetchJson<{ challenge: TypedDataPayload }>("/api/trading/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "challenge" }),
      });
      const signature = await signTypedData(session.walletAddress, challenge);
      const response = await fetchJson<{ credentials?: unknown }>("/api/trading/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          timestamp: String(challenge.message.timestamp ?? ""),
          nonce: String(challenge.message.nonce ?? "0"),
        }),
      });

      if (!response.credentials) {
        throw new Error("User CLOB credentials were not returned.");
      }

      setReadiness(await loadReadinessForPreview(preview));
      setStatus("idle");
      setMessage("Trading credentials are ready for this connected account.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function submitRealBid() {
    if (!session?.funderAddress || !preview.tokenId) {
      setStatus("error");
      setMessage("A connected wallet, deployed deposit wallet, and Polymarket token are required.");
      return;
    }

    setStatus("signing");
    setMessage("Review and sign the Polymarket order in your wallet.");

    try {
      const signable = buildUserOrderSignablePayload({
        preview,
        walletAddress: session.walletAddress,
        funderAddress: session.funderAddress,
        orderType: "FAK",
        builderCode: config?.builderCode,
      });
      const signature = await signTypedData(session.walletAddress, signable);
      const signedOrder = attachUserOrderSignature({
        signable,
        signature: signature as `0x${string}`,
      });

      setStatus("submitting");
      setMessage("Submitting signed order to Polymarket CLOB.");

      const payload = await fetchJson<{ order?: unknown; response?: unknown; error?: string }>("/api/trading/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...signedOrder,
          preview: buildUserOrderPreview(snapshot, preview),
        }),
      });

      setStatus("success");
      setMessage(payload.order ? "Real bid submitted and recorded." : "Real bid submitted to Polymarket.");
      setReadiness(await loadReadinessForPreview(preview));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section id="trade" className="panel team-detail-panel trade-entry-panel">
      <div className="panel-head">
        <h2 className="panel-title">Place a Bid</h2>
        <span className="view-all">User-owned real order</span>
      </div>
      <div className="trade-entry-market">
        <span>Market</span>
        <strong>{snapshot.team.name} to win World Cup</strong>
        <small>{snapshot.market.polymarket?.question ?? "Winner market"}</small>
      </div>
      <div className="trade-outcomes">
        <button
          type="button"
          className={outcomeSide === "yes" ? "active" : ""}
          onClick={() => {
            setOutcomeSide("yes");
            setLimitPrice(getDefaultLimitPrice(snapshot, "yes").toFixed(3));
            setMessage(undefined);
          }}
        >
          YES {formatProbability(yesPrice)}
        </button>
        <button
          type="button"
          className={outcomeSide === "no" ? "active" : ""}
          onClick={() => {
            setOutcomeSide("no");
            setLimitPrice(getDefaultLimitPrice(snapshot, "no").toFixed(3));
            setMessage(undefined);
          }}
        >
          NO {formatProbability(noPrice)}
        </button>
      </div>
      <div className="trade-ticket-input-grid">
        <label className="trade-ticket-input">
          <span>Bid amount</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setMessage(undefined);
            }}
          />
          <b>USDC</b>
        </label>
        <label className="trade-ticket-input">
          <span>Limit price</span>
          <input
            min="0.01"
            max="0.99"
            step="0.001"
            inputMode="decimal"
            type="number"
            value={limitPrice}
            onChange={(event) => {
              setLimitPrice(event.target.value);
              setMessage(undefined);
            }}
          />
          <b>{formatPriceCents(preview.sidePrice)}</b>
        </label>
      </div>
      <div className="team-detail-mini-grid">
        <PanelMetric label="Reference price" value={formatPriceCents(preview.sidePrice)} />
        <PanelMetric label="Estimated shares" value={formatShareSize(preview.shareSize)} />
        <PanelMetric label="Estimated total" value={formatMoney(preview.estimatedTotalCost)} />
        <PanelMetric label="Potential outcome" value={formatMoney(preview.potentialOutcome)} />
        <PanelMetric label="Min order" value={preview.minOrderSize ? formatMoney(preview.minOrderSize) : "Pending"} />
        <PanelMetric label="Accepting orders" value={preview.acceptingOrders ? "Yes" : "No"} />
      </div>
      <div className="trade-readiness">
        <div>
          <span>Wallet</span>
          <strong>{session ? formatShortWalletAddress(session.walletAddress) : "Not connected"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{getReadinessLabel(readiness, preview.disabledReason)}</strong>
        </div>
      </div>
      {failedChecks.length > 0 ? (
        <div className="trade-readiness-list">
          {failedChecks.slice(0, 3).map((check) => (
            <span key={check.id}>{check.label}: {check.detail}</span>
          ))}
        </div>
      ) : null}
      {!session ? (
        <button className="bid-button full" type="button" disabled={status === "loading"} onClick={connectWallet}>
          {status === "loading" ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : readiness?.credentials.hasClobCredentials === false ? (
        <button className="bid-button full" type="button" disabled={status === "signing"} onClick={deriveCredentials}>
          {status === "signing" ? "Waiting for signature..." : "Enable Trading Credentials"}
        </button>
      ) : (
        <button className="bid-button full" type="button" disabled={!canSubmit} onClick={submitRealBid}>
          {status === "signing" ? "Waiting for signature..." : status === "submitting" ? "Submitting..." : "Sign and Submit Real Bid"}
        </button>
      )}
      {message ? <p className={status === "error" ? "trade-ticket-message error" : "trade-ticket-message"}>{message}</p> : null}
      <p>Real orders use the connected user&apos;s wallet, deposit wallet, CLOB credentials, funds, and explicit signature. This is not financial advice.</p>
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
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    let ignore = false;

    async function loadFavouriteState() {
      try {
        const loadedSession = await loadTradingSession();

        if (ignore) {
          return;
        }

        setSession(loadedSession);

        if (!loadedSession) {
          setIsWatching(false);
          return;
        }

        const payload = await fetchJson<{ favourites: UserFavourite[] }>("/api/favourites");

        if (!ignore) {
          setIsWatching(payload.favourites.some((item) => item.entityType === "team" && item.entityId === teamId));
        }
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadFavouriteState();

    return () => {
      ignore = true;
    };
  }, [teamId]);

  async function toggleWatchlist() {
    setStatus("loading");
    setMessage(undefined);

    try {
      let activeSession = session;

      if (!activeSession) {
        activeSession = await connectTradingWallet();
        setSession(activeSession);
      }

      if (isWatching) {
        await fetch(`/api/favourites?entityType=team&entityId=${encodeURIComponent(teamId)}`, { method: "DELETE" });
        setIsWatching(false);
      } else {
        await fetchJson<{ favourite: UserFavourite }>("/api/favourites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ entityType: "team", entityId: teamId }),
        });
        setIsWatching(true);
      }

      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="panel team-detail-panel watchlist-panel">
      <div>
        <span>Watchlist</span>
        <h2>{teamName}</h2>
        <p>Save this team to your wallet-bound favourites and surface it on the watchlist board.</p>
      </div>
      <button type="button" onClick={toggleWatchlist} disabled={status === "loading"}>
        {status === "loading" ? "Saving..." : isWatching ? "Watching" : session ? "Add to Favourites" : "Connect to Favourite"}
      </button>
      {message ? <p className={status === "error" ? "trade-ticket-message error" : "trade-ticket-message"}>{message}</p> : null}
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
  metadata: TeamFootballMetadata | undefined,
  squad: ApiFootballSquadPlayer[],
  injuries: ApiFootballInjuryContext[],
  standings: ApiFootballStandingContext[],
  news: NewsEvent[],
): StrengthMetric[] {
  const rank = metadata?.fifaRank ?? snapshot.team.fifaRank;
  const rankBase = rank ? Math.max(64, 99 - rank * 1.2) : 76;
  const valueBoost = metadata?.squadValue ? Math.min(9, metadata.squadValue / 140_000_000) : 0;
  const attack = clampScore(rankBase + valueBoost);
  const midfield = clampScore(rankBase - 2 + squad.length * 0.18);
  const defense = clampScore(rankBase - injuries.length * 3);
  const form = clampScore(76 + (standings[0]?.wins ?? 2) * 3);
  const depth = clampScore(68 + Math.min(18, squad.length * 0.7) - injuries.length * 1.4);
  const continuity = clampScore(72 + news.length * 1.5 + (metadata?.worldCupTitles ? 3 : 0));

  return [
    { label: "Attack", value: attack },
    { label: "Midfield", value: midfield },
    { label: "Defense", value: defense },
    { label: "Form", value: form },
    { label: "Depth", value: depth },
    { label: "Continuity", value: continuity },
  ];
}

function getKeyPlayers(
  metadata: TeamFootballMetadata | undefined,
  squad: ApiFootballSquadPlayer[],
  injuries: ApiFootballInjuryContext[],
  snapshot: TeamMarketSnapshot,
): KeyPlayerView[] {
  const injuryNames = new Set(injuries.map((injury) => injury.playerName.toLowerCase()));
  const sourcePlayers: KeyPlayerSource[] = metadata?.keyPlayers.length
    ? metadata.keyPlayers.slice(0, 3).map((player, index) => mapMetadataPlayer(player, index))
    : squad.length > 0
      ? squad.slice(0, 3)
        : buildFallbackPlayers(snapshot.team.name).slice(0, 3);

  return sourcePlayers.map((player, index) => {
    const injured = injuryNames.has(player.name.toLowerCase());

    return {
      name: player.name,
      number: player.number,
      position: player.position ?? "Player",
      club: player.club,
      note: player.note,
      expectedMinutes: Math.max(54, 88 - index * 5 - (injured ? 22 : 0)),
      squadProbability: Math.max(64, 96 - index * 4 - (injured ? 20 : 0)),
      formScore: Math.max(70, Math.round(84 - index * 2)),
      injuryStatus: injured ? "Risk" : "Fit",
      topMarket: player.note ?? "Curated key player",
    };
  });
}

function mapMetadataPlayer(player: TeamKeyPlayer, index: number): KeyPlayerSource {
  return {
    playerId: index + 1,
    name: player.name,
    position: player.position,
    club: player.club,
    note: player.note,
  };
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

function getRecentMatches(fixtures: ApiFootballFixtureContext[]): RecentMatchView[] {
  return fixtures
    .filter((fixture) => fixture.status === "finished" && fixture.result)
    .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))
    .slice(0, 5)
    .map((fixture) => ({
      id: String(fixture.fixtureId),
      date: formatShortDate(fixture.kickoffAt),
      opponent: fixture.opponentName,
      status: fixture.status,
      result: fixture.result ?? "-",
      score: fixture.goalsFor !== undefined && fixture.goalsAgainst !== undefined
        ? `${fixture.goalsFor}-${fixture.goalsAgainst}`
        : "Pending",
      note: fixture.leagueName ?? "Fixture result stored from API-Football.",
    }));
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

function getGroupPeerMetadata(
  metadata: TeamFootballMetadata | undefined,
  allMetadata: TeamFootballMetadata[],
): TeamFootballMetadata[] {
  if (!metadata) {
    return [];
  }

  const peerIds = new Set(metadata.groupPeers);
  return allMetadata.filter((item) => peerIds.has(item.teamId));
}

function formatSquadValue(metadata: TeamFootballMetadata | undefined): string {
  if (!metadata?.squadValue) {
    return "Pending";
  }

  const currency = metadata.squadValueCurrency === "USD" ? "$" : "€";

  if (metadata.squadValue >= 1_000_000_000) {
    return `${currency}${(metadata.squadValue / 1_000_000_000).toFixed(2)}B`;
  }

  return `${currency}${Math.round(metadata.squadValue / 1_000_000)}M`;
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

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

async function loadReadinessForPreview(preview: ReturnType<typeof buildBidOrderPreview>) {
  const query = new URLSearchParams({
    tradeSide: "buy",
    cost: String(preview.estimatedCost),
    size: String(preview.shareSize),
    totalCost: String(preview.estimatedTotalCost),
    estimatedTakerFee: String(preview.estimatedTakerFee),
  });

  if (preview.tokenId) {
    query.set("tokenId", preview.tokenId);
  }

  return fetchJson<UserTradingReadiness>(`/api/trading/readiness?${query.toString()}`);
}

function getDefaultLimitPrice(snapshot: TeamMarketSnapshot, outcomeSide: OrderOutcomeSide) {
  return snapshot.market.polymarket?.tokens[outcomeSide]?.price ?? calculateReferencePrice(snapshot.market.probability, outcomeSide);
}

function buildUserOrderPreview(snapshot: TeamMarketSnapshot, preview: ReturnType<typeof buildBidOrderPreview>): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting a real order.");
  }

  return {
    marketId: snapshot.market.polymarket?.marketId ?? snapshot.market.polymarket?.conditionId,
    tokenId: preview.tokenId,
    teamId: snapshot.team.id,
    outcome: preview.outcomeSide,
    side: preview.tradeSide,
    orderType: "FAK",
    limitPrice: preview.sidePrice,
    size: preview.shareSize,
    estimatedCost: preview.estimatedCost,
    estimatedTakerFee: preview.estimatedTakerFee,
    estimatedTotalCost: preview.estimatedTotalCost,
    potentialOutcome: preview.potentialOutcome,
    tickSize: preview.tickSize ?? "0.01",
    negRisk: preview.negRisk,
    stale: false,
    warnings: preview.disabledReason ? [preview.disabledReason] : [],
  };
}

function getReadinessLabel(readiness: UserTradingReadiness | undefined, disabledReason: string | undefined) {
  if (disabledReason) {
    return "Market unavailable";
  }

  if (!readiness) {
    return "Checking";
  }

  if (readiness.ready) {
    return "Ready";
  }

  return "Needs review";
}

async function signTypedData(walletAddress: string, typedData: unknown): Promise<string> {
  const provider = getEthereumProvider();

  if (!provider) {
    throw new Error("No injected wallet provider found. Install or unlock an EVM wallet, then try again.");
  }

  const signature = await provider.request({
    method: "eth_signTypedData_v4",
    params: [walletAddress, JSON.stringify(typedData)],
  });

  if (typeof signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(signature)) {
    throw new Error("Wallet did not return a valid signature.");
  }

  return signature;
}

function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const maybeWindow = window as typeof window & {
    ethereum?: EthereumProvider & { providers?: EthereumProvider[] };
    okxwallet?: EthereumProvider;
  };

  return maybeWindow.ethereum?.providers?.[0] ?? maybeWindow.ethereum ?? maybeWindow.okxwallet;
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
