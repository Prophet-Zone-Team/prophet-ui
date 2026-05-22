import Link from "next/link";

import type { MarketDataMeta, WorldCupMarketData } from "../../data/providers/types";
import type {
  ApiFootballFixtureContext,
  ApiFootballTeamContext,
  NewsEvent,
  TeamFootballMetadata,
  TeamMarketSnapshot,
} from "../../types/market";
import { formatProbability, formatRelativeChange } from "../home/market-formatters";
import { TeamFlag } from "../teams/TeamFlag";
import { PlaceBidButton } from "../trading/PlaceBidButton";
import { WalletMenuButton } from "../trading/WalletMenuButton";

interface TeamsPageProps {
  snapshots: TeamMarketSnapshot[];
  newsEvents: NewsEvent[];
  footballTeamContext: ApiFootballTeamContext[];
  footballMetadata: TeamFootballMetadata[];
  dataStatus: MarketDataMeta;
  universe?: WorldCupMarketData["universe"];
}

interface TeamDirectoryRow {
  snapshot: TeamMarketSnapshot;
  metadata?: TeamFootballMetadata;
  footballContext?: ApiFootballTeamContext;
  directoryScore: number;
  recentMatches: ApiFootballFixtureContext[];
  newsSignalCount: number;
}

export function TeamsPage({
  snapshots,
  newsEvents,
  footballTeamContext,
  footballMetadata,
  dataStatus,
  universe,
}: TeamsPageProps) {
  const rows = buildTeamRows(snapshots, newsEvents, footballTeamContext, footballMetadata);
  const contextReadyCount = rows.filter((row) => row.footballContext).length;
  const metadataReadyCount = rows.filter((row) => row.metadata).length;
  const regions = new Set(rows.map((row) => row.snapshot.team.region));
  const mostValuableTeam = [...rows]
    .filter((row) => row.metadata?.squadValue)
    .sort((a, b) => (b.metadata?.squadValue ?? 0) - (a.metadata?.squadValue ?? 0))[0];
  const topRankedTeam = [...rows]
    .filter((row) => getTeamRank(row))
    .sort((a, b) => (getTeamRank(a) ?? 999) - (getTeamRank(b) ?? 999))[0];
  const bestFormTeam = [...rows]
    .filter((row) => row.recentMatches.length > 0)
    .sort((a, b) => getFormScore(b.recentMatches) - getFormScore(a.recentMatches))[0];

  return (
    <main className="prophet-html">
      <div className="page teams-pro-page">
        <TeamsTopbar />

        <section className="teams-page-hero" aria-labelledby="teams-page-title">
          <div>
            <span className="eyebrow">Team directory</span>
            <h1 id="teams-page-title">World Cup team dossiers.</h1>
            <p>
              Scan national teams by rank, squad value, recent form, group context, key players, news, and
              third-party odds. Market probability remains a secondary comparison layer.
            </p>
          </div>
          <div className="teams-summary" aria-label="Teams summary">
            <SummaryMetric label="Teams tracked" value={String(rows.length)} />
            <SummaryMetric label="Regions" value={String(regions.size)} />
            <SummaryMetric label="Curated profiles" value={`${metadataReadyCount}/${rows.length}`} />
            <SummaryMetric label="API-Football profiles" value={`${contextReadyCount}/${rows.length}`} />
          </div>
        </section>

        <section className="team-feature-grid" aria-label="Featured football team data">
          <FeaturedTeamCard title="Top FIFA Rank" row={topRankedTeam} metric="rank" />
          <FeaturedTeamCard title="Squad Value" row={mostValuableTeam} metric="value" />
          <FeaturedTeamCard title="Recent Form" row={bestFormTeam ?? rows[0]} metric="form" />
        </section>

        <section className="panel teams-index-panel" aria-label="World Cup team directory">
          <div className="panel-head">
            <h2 className="panel-title">Teams Directory</h2>
            <span className="live">{getFootballStatusCopy(dataStatus, universe)}</span>
          </div>

          <div className="teams-index-header" aria-hidden="true">
            <span>Team</span>
            <span>Rank / Value</span>
            <span>Form</span>
            <span>Group</span>
            <span>Key player</span>
            <span>Odds / Market</span>
            <span>Actions</span>
          </div>

          <div className="teams-index-list">
            {rows.map((row) => (
              <TeamDirectoryItem key={row.snapshot.team.id} row={row} />
            ))}
          </div>

          <div className="footnote">
            <span>Squad values, honors, and key stars are curated metadata with source timestamps.</span>
            <span>Quick Bid uses the user&apos;s own Polymarket deposit wallet and a locally approved session signer.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function TeamsTopbar() {
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

function FeaturedTeamCard({
  title,
  row,
  metric,
}: {
  title: string;
  row: TeamDirectoryRow | undefined;
  metric: "rank" | "value" | "form";
}) {
  if (!row) {
    return null;
  }

  const { team } = row.snapshot;
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
            {row.metadata?.group ? ` / Group ${row.metadata.group}` : ""}
          </p>
        </div>
      </div>
      <div className="team-feature-metrics">
        <FeatureMetric label={featured.primaryLabel} value={featured.primaryValue} />
        <FeatureMetric label={featured.secondaryLabel} value={featured.secondaryValue} />
      </div>
      <p className="team-feature-copy">{featured.copy}</p>
      <Link className="market-detail-button" href={`/team/${team.id}`}>
        View Team Detail
      </Link>
    </article>
  );
}

function TeamDirectoryItem({ row }: { row: TeamDirectoryRow }) {
  const { team, market } = row.snapshot;
  const metadata = row.metadata;
  const rankValue = getTeamRank(row);

  return (
    <article className="team-directory-row pro">
      <div className="team-index-main">
        <TeamFlag code={team.code} name={team.name} />
        <div>
          <h3>{team.name}</h3>
          <p>{team.region}</p>
        </div>
      </div>

      <div className="team-directory-profile">
        <TeamMetric label="FIFA rank" value={rankValue ? `#${rankValue}` : "Pending"} />
        <TeamMetric label="Squad value" value={formatSquadValue(metadata)} />
      </div>

      <div className="team-directory-form" aria-label="Last five match results">
        <FormStrip matches={row.recentMatches} />
      </div>

      <div className="team-directory-schedule">
        <TeamMetric label="Group" value={formatGroup(metadata)} />
      </div>

      <div className="team-directory-player" aria-label="Key player">
        <strong>{metadata?.keyPlayers[0]?.name ?? "Pending"}</strong>
      </div>

      <div className="team-market-context" aria-label="Outright odds and market probability">
        <strong>{formatProbability(market.bookmakerImpliedProbability)}</strong>
        <small className={market.change24h < 0 ? "text-red" : ""}>
          Market {formatProbability(market.probability)} · {formatRelativeChange(market.probability, market.change24h)}
        </small>
      </div>

      <div className="team-index-actions">
        <Link className="market-detail-button" href={`/team/${team.id}`}>
          View Detail
        </Link>
        <PlaceBidButton className="market-quick-bid secondary" snapshot={row.snapshot} teamName={team.name}>
          Quick Bid
        </PlaceBidButton>
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
    <div
      aria-label={`${label}: ${value}`}
      className={tone === "down" ? "team-metric down" : tone === "up" ? "team-metric up" : "team-metric"}
    >
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

function FormStrip({ matches }: { matches: ApiFootballFixtureContext[] }) {
  if (matches.length === 0) {
    return <strong className="form-empty">No official data</strong>;
  }

  return (
    <div className="form-strip" aria-label="Last five match results">
      {matches.slice(0, 5).map((match) => (
        <span key={match.fixtureId} className={match.result === "W" ? "win" : match.result === "L" ? "loss" : "draw"}>
          {match.result ?? "-"}
        </span>
      ))}
    </div>
  );
}

function buildTeamRows(
  snapshots: TeamMarketSnapshot[],
  newsEvents: NewsEvent[],
  footballTeamContext: ApiFootballTeamContext[],
  footballMetadata: TeamFootballMetadata[],
): TeamDirectoryRow[] {
  const contextByTeam = new Map(footballTeamContext.map((context) => [context.profile.teamId, context]));
  const metadataByTeam = new Map(footballMetadata.map((metadata) => [metadata.teamId, metadata]));
  const newsByTeam = groupNewsByTeam(newsEvents);

  return snapshots
    .map((snapshot) => {
      const context = contextByTeam.get(snapshot.team.id);
      const metadata = metadataByTeam.get(snapshot.team.id);
      const recentMatches = getRecentMatches(context);
      const newsSignalCount = newsByTeam.get(snapshot.team.id)?.length ?? 0;
      const directoryScore = getDirectoryScore(snapshot, metadata, context, newsSignalCount, recentMatches);

      return {
        snapshot,
        metadata,
        footballContext: context,
        directoryScore,
        recentMatches,
        newsSignalCount,
      };
    })
    .sort((a, b) => {
      const rankA = getTeamRank(a) ?? 999;
      const rankB = getTeamRank(b) ?? 999;

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

function getDirectoryScore(
  snapshot: TeamMarketSnapshot,
  metadata: TeamFootballMetadata | undefined,
  context: ApiFootballTeamContext | undefined,
  newsSignalCount: number,
  recentMatches: ApiFootballFixtureContext[],
): number {
  const rankScore = getRankValue(metadata, snapshot) ? Math.max(0, 60 - (getRankValue(metadata, snapshot) ?? 999)) : 10;
  const valueScore = metadata?.squadValue ? Math.min(20, metadata.squadValue / 65_000_000) : 0;
  const formScore = getFormScore(recentMatches);
  const profileScore = context ? 12 : 0;
  const fixtureScore = context?.fixtures.length ? 6 : 0;

  return Math.round(rankScore + valueScore + formScore + profileScore + fixtureScore + newsSignalCount);
}

function getRecentMatches(context: ApiFootballTeamContext | undefined): ApiFootballFixtureContext[] {
  if (!context) {
    return [];
  }

  return [...context.fixtures]
    .filter((fixture) => fixture.status === "finished" && fixture.result)
    .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))
    .slice(0, 5);
}

function getFeaturedMetric(row: TeamDirectoryRow, metric: "rank" | "value" | "form") {
  switch (metric) {
    case "rank":
      return {
        badge: getTeamRank(row) ? `#${getTeamRank(row)}` : "Rank",
        primaryLabel: "FIFA rank",
        primaryValue: getTeamRank(row) ? `#${getTeamRank(row)}` : "Pending",
        secondaryLabel: "Best WC finish",
        secondaryValue: row.metadata?.worldCupBestFinish ?? "Pending",
        copy: `${row.snapshot.team.name} sits highest in the current curated team directory.`,
      };
    case "value":
      return {
        badge: "Value",
        primaryLabel: "Squad value",
        primaryValue: formatSquadValue(row.metadata),
        secondaryLabel: "Key player",
        secondaryValue: row.metadata?.keyPlayers[0]?.name ?? "Pending",
        copy: "Squad value is curated metadata and should be reviewed periodically against the chosen source.",
      };
    case "form":
      return {
        badge: row.recentMatches.length ? `${getFormScore(row.recentMatches)} pts` : "Pending",
        primaryLabel: "Recent form",
        primaryValue: formatFormText(row.recentMatches),
        secondaryLabel: "Group",
        secondaryValue: formatGroup(row.metadata),
        copy: row.recentMatches.length
          ? "Recent form uses real finished fixtures from API-Football."
          : "Recent match result data is not available for this team yet.",
      };
  }
}

function getTeamRank(row: TeamDirectoryRow): number | undefined {
  return getRankValue(row.metadata, row.snapshot);
}

function getRankValue(metadata: TeamFootballMetadata | undefined, snapshot: TeamMarketSnapshot): number | undefined {
  return metadata?.fifaRank ?? snapshot.team.fifaRank;
}

function getFormScore(matches: ApiFootballFixtureContext[]): number {
  return matches.reduce((sum, match) => {
    if (match.result === "W") {
      return sum + 3;
    }

    if (match.result === "D") {
      return sum + 1;
    }

    return sum;
  }, 0);
}

function formatFormText(matches: ApiFootballFixtureContext[]): string {
  if (matches.length === 0) {
    return "No official data";
  }

  return matches.map((match) => match.result ?? "-").join("");
}

function formatSquadValue(metadata: TeamFootballMetadata | undefined): string {
  if (!metadata?.squadValue) {
    return "Pending";
  }

  const value = metadata.squadValue;
  const currency = metadata.squadValueCurrency === "USD" ? "$" : "€";

  if (value >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(2)}B`;
  }

  return `${currency}${Math.round(value / 1_000_000)}M`;
}

function formatGroup(metadata: TeamFootballMetadata | undefined): string {
  if (!metadata?.group || metadata.group === "Pending") {
    return "Pending";
  }

  return `Group ${metadata.group}`;
}

function getFootballStatusCopy(meta: MarketDataMeta, universe: WorldCupMarketData["universe"] | undefined): string {
  if (meta.football?.status === "live") {
    return `${meta.football.teamCount} football profiles`;
  }

  if (universe?.canonicalTeamCount) {
    return `${universe.canonicalTeamCount} teams`;
  }

  return "Directory";
}
