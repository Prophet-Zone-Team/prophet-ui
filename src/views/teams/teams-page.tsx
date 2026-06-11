"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("teams");
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
          {t("teamDirectory")}
        </p>
        <h1 id="teams-page-title" className={cn("mt-2", teamsHeroTitleClass)}>
          {t("pageTitle")}
        </h1>
        <p className={cn("mt-4", teamsHeroCopyClass)}>
          {t("pageDescription")}
        </p>
        <div
          className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          aria-label={t("teamsSummary")}
        >
          <HeroStat label={t("teamsTracked")} value={String(rows.length)} />
          <HeroStat label={t("regions")} value={String(regions.size)} />
          <HeroStat
            label={t("curatedProfiles")}
            value={`${metadataReadyCount}/${rows.length}`}
          />
          <HeroStat
            label={t("apiFootballProfiles")}
            value={`${contextReadyCount}/${rows.length}`}
          />
        </div>
      </header>

      <section
        className="mb-6 grid gap-4 lg:grid-cols-3"
        aria-label={t("featuredFootballTeamData")}
      >
        <FeaturedTeamCard
          title={t("topFifaRank")}
          row={topRankedTeam}
          metric="rank"
          t={t}
        />
        <FeaturedTeamCard
          title={t("squadValue")}
          row={mostValuableTeam}
          metric="value"
          t={t}
        />
        <FeaturedTeamCard
          title={t("recentForm")}
          row={bestFormTeam ?? rows[0]}
          metric="form"
          t={t}
        />
      </section>

      <section
        className={teamsPanelClass}
        aria-label={t("worldCupTeamDirectory")}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-[500] text-black">
            {t("teamsDirectory")}
          </h2>
          <span className="text-xs font-[500] text-prophet-muted">
            {getFootballStatusCopy(dataStatus, universe, t)}
          </span>
        </div>

        <div className={teamsDirectoryHeadClass} aria-hidden="true">
          <span>{t("tableTeam")}</span>
          <span>{t("tableRankValue")}</span>
          <span>{t("tableForm")}</span>
          <span>{t("tableGroup")}</span>
          <span>{t("tableKeyPlayer")}</span>
          <span>{t("tableOddsMarket")}</span>
          <span>{t("tableActions")}</span>
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
          <span>{t("directoryFooterMetadata")}</span>
          <span>{t("directoryFooterBid")}</span>
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

type TeamsTranslator = ReturnType<typeof useTranslations<"teams">>;

function FeaturedTeamCard({
  title,
  row,
  metric,
  t
}: {
  title: string;
  row: TeamDirectoryRow | undefined;
  metric: "rank" | "value" | "form";
  t: TeamsTranslator;
}) {
  if (!row) {
    return null;
  }

  const { team } = row.snapshot;
  const featured = getFeaturedMetric(row, metric, t);

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
            {row.metadata?.group
              ? ` / ${t("groupLabel", { group: row.metadata.group })}`
              : ""}
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
          {t("viewDossier")}
        </Link>
        <Link className={teamsDetailButtonClass} href={teamTradeHref(team.id)}>
          {t("openTrade")}
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

function getFeaturedMetric(
  row: TeamDirectoryRow,
  metric: "rank" | "value" | "form",
  t: TeamsTranslator
) {
  switch (metric) {
    case "rank":
      return {
        badge: getTeamRank(row) ? `#${getTeamRank(row)}` : t("rank"),
        primaryLabel: t("fifaRank"),
        primaryValue: getTeamRank(row) ? `#${getTeamRank(row)}` : t("pending"),
        secondaryLabel: t("bestWcFinish"),
        secondaryValue: row.metadata?.worldCupBestFinish ?? t("pending"),
        copy: t("featuredRankCopy", { teamName: row.snapshot.team.name })
      };
    case "value":
      return {
        badge: t("value"),
        primaryLabel: t("squadValue"),
        primaryValue: formatSquadValue(row.metadata, t),
        secondaryLabel: t("keyPlayer"),
        secondaryValue: row.metadata?.keyPlayers[0]?.name ?? t("pending"),
        copy: t("featuredValueCopy")
      };
    case "form":
      return {
        badge: row.recentMatches.length
          ? t("formPoints", { points: getFormScore(row.recentMatches) })
          : t("pending"),
        primaryLabel: t("recentForm"),
        primaryValue: formatFormText(row.recentMatches, t),
        secondaryLabel: t("group"),
        secondaryValue: formatGroup(row.metadata, t),
        copy: row.recentMatches.length
          ? t("featuredFormCopyWithData")
          : t("featuredFormCopyNoData")
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

function formatFormText(
  matches: ApiFootballFixtureContext[],
  t: TeamsTranslator
): string {
  if (matches.length === 0) {
    return t("noOfficialData");
  }

  return matches.map((match) => match.result ?? "-").join("");
}

function formatSquadValue(
  metadata: TeamFootballMetadata | undefined,
  t: TeamsTranslator
): string {
  if (!metadata?.squadValue) {
    return t("pending");
  }

  const value = metadata.squadValue;
  const currency = metadata.squadValueCurrency === "USD" ? "$" : "€";

  if (value >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(2)}B`;
  }

  return `${currency}${Math.round(value / 1_000_000)}M`;
}

function formatGroup(
  metadata: TeamFootballMetadata | undefined,
  t: TeamsTranslator
): string {
  if (!metadata?.group || metadata.group === "Pending") {
    return t("pending");
  }

  return t("groupLabel", { group: metadata.group });
}

function getFootballStatusCopy(
  meta: MarketDataMeta,
  universe: WorldCupMarketData["universe"] | undefined,
  t: TeamsTranslator
): string {
  if (meta.football?.status === "live") {
    return t("footballProfiles", { count: meta.football.teamCount });
  }

  if (universe?.canonicalTeamCount) {
    return t("teamsCount", { count: universe.canonicalTeamCount });
  }

  return t("directory");
}
