import Link from "next/link";

import type { MarketDataMeta, WorldCupMarketData } from "@/data/providers/types";
import { TeamFlag } from "@/components/teams/team-flag";
import { teamDetailHref } from "@/lib/routes/team";
import { teamTradeHref } from "@/lib/routes/trade";
import { cn } from "@/lib/cn";
import type {
  ApiFootballFixtureContext,
  ApiFootballTeamContext,
  NewsEvent,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";
import { TeamsDirectoryItem } from "@/views/teams/teams-directory-item";
import {
  teamsDetailButtonClass,
  teamsDirectoryHeadClass,
  teamsFeaturedCardClass,
  teamsHeroCopyClass,
  teamsHeroTitleClass,
  teamsMetricLabelClass,
  teamsPageClass,
  teamsPanelClass
} from "@/views/teams/teams-ui";

export interface TeamsPageProps {
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

const heroStatValueClassName =
  "block text-[32px] font-[500] leading-[38px] text-black";

export function TeamsPage({
  snapshots,
  newsEvents,
  footballTeamContext,
  footballMetadata,
  dataStatus,
  universe
}: TeamsPageProps) {
  const rows = buildTeamRows(
    snapshots,
    newsEvents,
    footballTeamContext,
    footballMetadata
  );
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
    <section className={teamsPageClass}>
      <header className="pb-8">
        <p className="text-sm font-[500] uppercase tracking-[0.18em] text-prophet-muted">
          Team directory
        </p>
        <h1 id="teams-page-title" className={cn("mt-2", teamsHeroTitleClass)}>
          World Cup team dossiers
        </h1>
        <p className={cn("mt-4", teamsHeroCopyClass)}>
          Scan national teams by rank, squad value, recent form, group context,
          key players, news, and third-party odds. Market probability remains a
          secondary comparison layer.
        </p>
        <div
          className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Teams summary"
        >
          <HeroStat label="Teams tracked" value={String(rows.length)} />
          <HeroStat label="Regions" value={String(regions.size)} />
          <HeroStat
            label="Curated profiles"
            value={`${metadataReadyCount}/${rows.length}`}
          />
          <HeroStat
            label="API-Football profiles"
            value={`${contextReadyCount}/${rows.length}`}
          />
        </div>
      </header>

      <section
        className="mb-6 grid gap-4 lg:grid-cols-3"
        aria-label="Featured football team data"
      >
        <FeaturedTeamCard
          title="Top FIFA Rank"
          row={topRankedTeam}
          metric="rank"
        />
        <FeaturedTeamCard
          title="Squad Value"
          row={mostValuableTeam}
          metric="value"
        />
        <FeaturedTeamCard
          title="Recent Form"
          row={bestFormTeam ?? rows[0]}
          metric="form"
        />
      </section>

      <section
        className={teamsPanelClass}
        aria-label="World Cup team directory"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-[500] text-black">Teams directory</h2>
          <span className="text-xs font-[500] text-prophet-muted">
            {getFootballStatusCopy(dataStatus, universe)}
          </span>
        </div>

        <div className={teamsDirectoryHeadClass} aria-hidden="true">
          <span>Team</span>
          <span>Rank / value</span>
          <span>Form</span>
          <span>Group</span>
          <span>Key player</span>
          <span>Odds / market</span>
          <span>Actions</span>
        </div>

        <div className="grid gap-2">
          {rows.map((row) => (
            <TeamsDirectoryItem
              key={row.snapshot.team.id}
              snapshot={row.snapshot}
              metadata={row.metadata}
              recentMatches={row.recentMatches}
            />
          ))}
        </div>

        <footer className="mt-5 flex flex-col gap-1 text-xs text-prophet-muted sm:flex-row sm:justify-between">
          <span>
            Squad values, honors, and key stars are curated metadata with source
            timestamps.
          </span>
          <span>
            Bid opens your own Polymarket order preview with user-owned wallet
            signing.
          </span>
        </footer>
      </section>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-prophet-line/80 bg-[#fafbfc] px-4 py-3 text-center sm:text-left">
      <strong className={heroStatValueClassName}>{value}</strong>
      <span className="mt-1 block text-sm text-prophet-muted">{label}</span>
    </div>
  );
}

function FeaturedTeamCard({
  title,
  row,
  metric
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
    <article className={teamsFeaturedCardClass}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-[500] uppercase tracking-wide text-prophet-muted">
          {title}
        </span>
        <strong className="text-sm font-[500] text-black">
          {featured.badge}
        </strong>
      </div>
      <div className="flex items-center gap-3">
        <TeamFlag
          code={team.code}
          name={team.name}
          className="h-10 w-10 shrink-0 rounded-[2px] text-[40px]"
        />
        <div className="min-w-0">
          <h3 className="m-0 text-lg font-[500] leading-[21px] text-black">
            {team.name}
          </h3>
          <p className={cn("m-0 mt-0.5", teamsMetricLabelClass)}>
            {team.code} / {team.region}
            {row.metadata?.group ? ` / Group ${row.metadata.group}` : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FeaturedMetric
          label={featured.primaryLabel}
          value={featured.primaryValue}
        />
        <FeaturedMetric
          label={featured.secondaryLabel}
          value={featured.secondaryValue}
        />
      </div>
      <p className="m-0 text-xs leading-relaxed text-prophet-muted">
        {featured.copy}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link className={teamsDetailButtonClass} href={teamDetailHref(team.id)}>
          View dossier
        </Link>
        <Link className={teamsDetailButtonClass} href={teamTradeHref(team.id)}>
          Open trade
        </Link>
      </div>
    </article>
  );
}

function FeaturedMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-prophet-line/80 bg-white/80 px-3 py-2">
      <strong className="block text-sm font-[500] text-black">{value}</strong>
      <span className="mt-0.5 block text-[10px] font-[500] uppercase tracking-wide text-prophet-muted">
        {label}
      </span>
    </div>
  );
}

function buildTeamRows(
  snapshots: TeamMarketSnapshot[],
  newsEvents: NewsEvent[],
  footballTeamContext: ApiFootballTeamContext[],
  footballMetadata: TeamFootballMetadata[]
): TeamDirectoryRow[] {
  const contextByTeam = new Map(
    footballTeamContext.map((context) => [context.profile.teamId, context])
  );
  const metadataByTeam = new Map(
    footballMetadata.map((metadata) => [metadata.teamId, metadata])
  );
  const newsByTeam = groupNewsByTeam(newsEvents);

  return snapshots
    .map((snapshot) => {
      const context = contextByTeam.get(snapshot.team.id);
      const metadata = metadataByTeam.get(snapshot.team.id);
      const recentMatches = getRecentMatches(context);
      const newsSignalCount = newsByTeam.get(snapshot.team.id)?.length ?? 0;
      const directoryScore = getDirectoryScore(
        snapshot,
        metadata,
        context,
        newsSignalCount,
        recentMatches
      );

      return {
        snapshot,
        metadata,
        footballContext: context,
        directoryScore,
        recentMatches,
        newsSignalCount
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
  recentMatches: ApiFootballFixtureContext[]
): number {
  const rankScore = getRankValue(metadata, snapshot)
    ? Math.max(0, 60 - (getRankValue(metadata, snapshot) ?? 999))
    : 10;
  const valueScore = metadata?.squadValue
    ? Math.min(20, metadata.squadValue / 65_000_000)
    : 0;
  const formScore = getFormScore(recentMatches);
  const profileScore = context ? 12 : 0;
  const fixtureScore = context?.fixtures.length ? 6 : 0;

  return Math.round(rankScore + valueScore + formScore + profileScore + fixtureScore + newsSignalCount);
}

function getRecentMatches(
  context: ApiFootballTeamContext | undefined
): ApiFootballFixtureContext[] {
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
        copy: `${row.snapshot.team.name} sits highest in the current curated team directory.`
      };
    case "value":
      return {
        badge: "Value",
        primaryLabel: "Squad value",
        primaryValue: formatSquadValue(row.metadata),
        secondaryLabel: "Key player",
        secondaryValue: row.metadata?.keyPlayers[0]?.name ?? "Pending",
        copy: "Squad value is curated metadata and should be reviewed periodically against the chosen source."
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
          : "Recent match result data is not available for this team yet."
      };
  }
}

function getTeamRank(row: TeamDirectoryRow): number | undefined {
  return getRankValue(row.metadata, row.snapshot);
}

function getRankValue(
  metadata: TeamFootballMetadata | undefined,
  snapshot: TeamMarketSnapshot
): number | undefined {
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

function getFootballStatusCopy(
  meta: MarketDataMeta,
  universe: WorldCupMarketData["universe"] | undefined
): string {
  if (meta.football?.status === "live") {
    return `${meta.football.teamCount} football profiles`;
  }

  if (universe?.canonicalTeamCount) {
    return `${universe.canonicalTeamCount} teams`;
  }

  return "Directory";
}
