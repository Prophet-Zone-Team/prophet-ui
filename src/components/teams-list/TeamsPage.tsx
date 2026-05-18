import Link from "next/link";

import type { MarketDataMeta, WorldCupMarketData } from "../../data/providers/types";
import type { ApiFootballFixtureContext, ApiFootballTeamContext, NewsEvent, TeamMarketSnapshot } from "../../types/market";
import { formatChange, formatProbability } from "../home/market-formatters";
import { TeamFlag } from "../teams/TeamFlag";
import { WalletMenuButton } from "../trading/WalletMenuButton";

interface TeamsPageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  footballTeamContext: ApiFootballTeamContext[];
  dataStatus: MarketDataMeta;
  universe?: WorldCupMarketData["universe"];
}

type InjuryStatusLabel = "Clear" | "Watch" | "Injury risk" | "Pending";

interface TeamDirectoryRow {
  snapshot: TeamMarketSnapshot;
  footballContext?: ApiFootballTeamContext;
  directoryScore: number;
  injuryStatusLabel: InjuryStatusLabel;
  injuryStatusDetail: string;
  injuryCount?: number;
  nextFixture?: ApiFootballFixtureContext;
  newsSignalCount: number;
}

export function TeamsPage({ snapshots, newsEvents, footballTeamContext, dataStatus, universe }: TeamsPageProps) {
  const rows = buildTeamRows(snapshots, newsEvents, footballTeamContext);
  const contextReadyCount = rows.filter((row) => row.footballContext).length;
  const injuryWatchCount = rows.filter((row) => row.injuryStatusLabel === "Watch" || row.injuryStatusLabel === "Injury risk").length;
  const regions = new Set(rows.map((row) => row.snapshot.team.region));
  const topRankedTeam = [...rows]
    .filter((row) => row.snapshot.team.fifaRank)
    .sort((a, b) => (a.snapshot.team.fifaRank ?? 999) - (b.snapshot.team.fifaRank ?? 999))[0];
  const injuryWatchTeam = [...rows].sort((a, b) => (b.injuryCount ?? -1) - (a.injuryCount ?? -1))[0];
  const nextFixtureTeam = [...rows]
    .filter((row) => row.nextFixture)
    .sort((a, b) => (a.nextFixture?.kickoffAt ?? "").localeCompare(b.nextFixture?.kickoffAt ?? ""))[0];

  return (
    <main className="prophet-html">
      <div className="page">
        <TeamsTopbar source={dataStatus.source} />

        <section className="teams-page-hero" aria-labelledby="teams-page-title">
          <div>
            <span className="eyebrow">Team directory</span>
            <h1 id="teams-page-title">World Cup teams, football first.</h1>
            <p>
              Browse each team by FIFA rank, region, injuries, upcoming fixtures, news context, and a small
              market signal for deeper research.
            </p>
          </div>
          <div className="teams-summary" aria-label="Teams summary">
            <SummaryMetric label="Teams tracked" value={String(rows.length)} />
            <SummaryMetric label="Regions" value={String(regions.size)} />
            <SummaryMetric label="Football profiles" value={`${contextReadyCount}/${rows.length}`} />
            <SummaryMetric label="Injury watch" value={String(injuryWatchCount)} />
          </div>
        </section>

        <section className="team-feature-grid" aria-label="Featured football team data">
          <FeaturedTeamCard title="Top FIFA Rank" row={topRankedTeam} source={dataStatus.source} metric="rank" />
          <FeaturedTeamCard title="Injury Watch" row={injuryWatchTeam} source={dataStatus.source} metric="injury" />
          <FeaturedTeamCard title="Next Fixture" row={nextFixtureTeam ?? rows[0]} source={dataStatus.source} metric="fixture" />
        </section>

        <section className="panel teams-index-panel" aria-label="World Cup team directory">
          <div className="panel-head">
            <h2 className="panel-title">Teams Directory</h2>
            <span className="live">{getFootballStatusCopy(dataStatus, universe)}</span>
          </div>

          <div className="teams-index-list">
            {rows.map((row, index) => (
              <TeamDirectoryItem key={row.snapshot.team.id} row={row} rank={index + 1} source={dataStatus.source} />
            ))}
          </div>

      <div className="footnote">
            <span>Football rows prioritize team profile, injuries, fixtures, and news context.</span>
            <span>Market probability is secondary context only.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function TeamsTopbar({ source }: { source: MarketDataMeta["source"] }) {
  return (
    <header className="topbar">
      <Link className="brand" href={`/?source=${source}`} aria-label="Prophet home">
        <span className="mark" aria-hidden="true" />
        Prophet
      </Link>
      <nav aria-label="Primary navigation">
        <Link href={`/markets?source=${source}`}>Markets</Link>
        <Link href={`/matches?source=${source}`}>Matches</Link>
        <Link href={`/teams?source=${source}`} aria-current="page">Teams</Link>
        <Link href={`/bid?source=${source}`}>Portfolio</Link>
      </nav>
      <WalletMenuButton source={source} />
    </header>
  );
}

function FeaturedTeamCard({
  title,
  row,
  source,
  metric,
}: {
  title: string;
  row: TeamDirectoryRow | undefined;
  source: MarketDataMeta["source"];
  metric: "rank" | "injury" | "fixture";
}) {
  if (!row) {
    return null;
  }

  const { team, market } = row.snapshot;
  const featured = getFeaturedMetric(row, metric);

  return (
    <article className="team-feature-card football">
      <div className="team-feature-head">
        <span>{title}</span>
        <strong>{featured.badge}</strong>
      </div>
      <div className="team-feature-main">
        <TeamFlag code={team.code} name={team.name} />
        <div>
          <h3>{team.name}</h3>
          <p>
            {team.code} / {team.region}
            {team.fifaRank ? ` / FIFA #${team.fifaRank}` : ""}
          </p>
        </div>
      </div>
      <div className="team-feature-metrics">
        <FeatureMetric label={featured.primaryLabel} value={featured.primaryValue} />
        <FeatureMetric label="Market context" value={`${formatProbability(market.probability)} / ${formatChange(market.change24h)}`} tone={market.change24h < 0 ? "down" : "up"} />
      </div>
      <p className="team-feature-copy">{featured.copy}</p>
      <Link className="market-detail-button" href={`/team/${team.id}?source=${source}`}>
        View Team Detail
      </Link>
    </article>
  );
}

function TeamDirectoryItem({ row, rank, source }: { row: TeamDirectoryRow; rank: number; source: MarketDataMeta["source"] }) {
  const { team, market } = row.snapshot;

  return (
    <article className="team-directory-row">
      <div className="team-index-rank">{rank}</div>

      <div className="team-index-main">
        <TeamFlag code={team.code} name={team.name} />
        <div>
          <h3>{team.name}</h3>
          <p>
            {team.code} / {team.region}
            {team.group ? ` / Group ${team.group}` : ""}
          </p>
        </div>
      </div>

      <div className="team-directory-profile">
        <TeamMetric label="FIFA rank" value={team.fifaRank ? `#${team.fifaRank}` : "Pending"} />
      </div>

      <div className="team-directory-football">
        <TeamMetric label="Injuries" value={row.injuryCount !== undefined ? String(row.injuryCount) : "Pending"} tone={row.injuryStatusLabel === "Injury risk" ? "down" : undefined} />
      </div>

      <div className="team-directory-schedule">
        <TeamMetric label="Next fixture" value={formatFixture(row.nextFixture)} />
        <TeamMetric label="News" value={row.newsSignalCount > 0 ? `${row.newsSignalCount} signals` : "No signal"} />
      </div>

      <div className="team-market-context">
        <span>Market context</span>
        <strong>{formatProbability(market.probability)}</strong>
        <small className={market.change24h < 0 ? "text-red" : ""}>{formatChange(market.change24h)}</small>
      </div>

      <div className="team-index-actions">
        <Link className="market-detail-button" href={`/team/${team.id}?source=${source}`}>
          View Detail
        </Link>
      </div>
    </article>
  );
}

function FeatureMetric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className={tone === "down" ? "feature-metric down" : "feature-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TeamMetric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className={tone === "down" ? "team-metric down" : tone === "up" ? "team-metric up" : "team-metric"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="hero-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function buildTeamRows(
  snapshots: TeamMarketSnapshot[],
  newsEvents: NewsEvent[],
  footballTeamContext: ApiFootballTeamContext[],
): TeamDirectoryRow[] {
  const contextByTeam = new Map(footballTeamContext.map((context) => [context.profile.teamId, context]));
  const newsByTeam = groupNewsByTeam(newsEvents);

  return snapshots
    .map((snapshot) => {
      const context = contextByTeam.get(snapshot.team.id);
      const injuryStatus = getInjuryStatus(context);
      const injuryCount = context ? context.injuries.length : undefined;
      const nextFixture = getNextFixture(context);
      const newsSignalCount = newsByTeam.get(snapshot.team.id)?.length ?? 0;
      const directoryScore = getDirectoryScore(snapshot, context, newsSignalCount);

      return {
        snapshot,
        footballContext: context,
        directoryScore,
        injuryStatusLabel: injuryStatus.label,
        injuryStatusDetail: injuryStatus.detail,
        injuryCount,
        nextFixture,
        newsSignalCount,
      };
    })
    .sort((a, b) => {
      const rankA = a.snapshot.team.fifaRank ?? 999;
      const rankB = b.snapshot.team.fifaRank ?? 999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return b.directoryScore - a.directoryScore;
    });
}

function groupNewsByTeam(newsEvents: NewsEvent[]): Map<string, NewsEvent[]> {
  const grouped = new Map<string, NewsEvent[]>();

  for (const event of newsEvents) {
    grouped.set(event.teamId, [...(grouped.get(event.teamId) ?? []), event]);
  }

  return grouped;
}

function getDirectoryScore(snapshot: TeamMarketSnapshot, context: ApiFootballTeamContext | undefined, newsSignalCount: number): number {
  const rankScore = snapshot.team.fifaRank ? Math.max(0, 60 - snapshot.team.fifaRank) : 10;
  const profileScore = context ? 18 : 0;
  const squadScore = Math.min(12, context?.squad.length ?? 0);
  const fixtureScore = context?.fixtures.length ? 6 : 0;

  return Math.round(rankScore + profileScore + squadScore + fixtureScore + newsSignalCount);
}

function getInjuryStatus(context: ApiFootballTeamContext | undefined): { label: InjuryStatusLabel; detail: string } {
  if (!context) {
    return { label: "Pending", detail: "API-Football context pending" };
  }

  if (context.injuries.length >= 3) {
    return { label: "Injury risk", detail: `${context.injuries.length} injuries stored` };
  }

  if (context.injuries.length > 0 || context.dataIssues.length > 0) {
    return { label: "Watch", detail: context.injuries.length > 0 ? `${context.injuries.length} injuries stored` : "Some football slices pending" };
  }

  return { label: "Clear", detail: "No injury signal stored" };
}

function getNextFixture(context: ApiFootballTeamContext | undefined): ApiFootballFixtureContext | undefined {
  if (!context) {
    return undefined;
  }

  return [...context.fixtures]
    .filter((fixture) => fixture.status === "scheduled")
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))[0];
}

function getFeaturedMetric(row: TeamDirectoryRow, metric: "rank" | "injury" | "fixture") {
  switch (metric) {
    case "rank":
      return {
        badge: row.snapshot.team.fifaRank ? `#${row.snapshot.team.fifaRank}` : "Rank",
        primaryLabel: "FIFA rank",
        primaryValue: row.snapshot.team.fifaRank ? `#${row.snapshot.team.fifaRank}` : "Pending",
        copy: `${row.snapshot.team.name} is listed as a top-ranked team in the current World Cup directory.`,
      };
    case "injury":
      return {
        badge: row.injuryStatusLabel,
        primaryLabel: "Injuries",
        primaryValue: row.injuryCount !== undefined ? String(row.injuryCount) : "Pending",
        copy: row.injuryStatusDetail,
      };
    case "fixture":
      return {
        badge: row.nextFixture ? "Fixture" : "Pending",
        primaryLabel: "Next fixture",
        primaryValue: formatFixture(row.nextFixture),
        copy: row.nextFixture
          ? `${row.snapshot.team.name} ${row.nextFixture.homeAway === "away" ? "at" : "vs"} ${row.nextFixture.opponentName}.`
          : "Upcoming fixture data is pending for this team.",
      };
  }
}

function formatFixture(fixture: ApiFootballFixtureContext | undefined): string {
  if (!fixture) {
    return "Pending";
  }

  const prefix = fixture.homeAway === "away" ? "at" : "vs";
  return `${prefix} ${fixture.opponentName}`;
}

function getFootballStatusCopy(meta: MarketDataMeta, universe: WorldCupMarketData["universe"] | undefined): string {
  if (meta.football?.status === "live") {
    return `${meta.football.teamCount} profiles`;
  }

  if (universe?.canonicalTeamCount) {
    return `${universe.canonicalTeamCount} teams`;
  }

  return "Directory";
}
