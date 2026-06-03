import type {
  ProphetAnalyticsMostAffectedTeamItem,
  ProphetAnalyticsNewsImpact,
  ProphetAnalyticsTopCategoryItem
} from "@/types/prophet-api";
import {
  resolveTeamCode,
  type TeamCodeLookup
} from "@/lib/analytics/map-team-power-ranking";
import type { SignalSummaryStats } from "@/views/analytics/news/types";
import type { MostAffectedTeamData } from "@/views/signal/most-affected-team/types";
import type { ImpactDistributionOverviewData } from "@/views/signal/overview/types";
import type { TopCategoriesData } from "@/views/signal/top-categories/types";

function toNumber(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

function parseImpactNumber(value: string | number | undefined): number {
  if (typeof value === "number") {
    return toNumber(value);
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toCategoryLabel(value: string | undefined): string {
  if (!value) {
    return "General";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function mapTopCategoryImpactToSummary(
  impact: ProphetAnalyticsNewsImpact | undefined
): SignalSummaryStats {
  const positive = toNumber(impact?.positive);
  const negative = toNumber(impact?.negative);
  const neutral = toNumber(impact?.neutral);
  const highImpact = toNumber(impact?.high_impact);

  return {
    todaySignal: positive + negative + neutral,
    positive,
    negative,
    highImpact
  };
}

export function mapTopCategoryImpactToCategories(
  topCategories: ProphetAnalyticsTopCategoryItem[] | undefined
): TopCategoriesData {
  return {
    categories: (topCategories ?? []).map((item) => ({
      id: item.category ?? "general",
      label: toCategoryLabel(item.category),
      count: toNumber(item.total),
      percent: toNumber(item.percent)
    }))
  };
}

export function mapTopCategoryImpactToOverview(
  impact: ProphetAnalyticsNewsImpact | undefined
): ImpactDistributionOverviewData {
  return {
    segments: [
      { sentiment: "positive", count: toNumber(impact?.positive) },
      { sentiment: "neutral", count: toNumber(impact?.neutral) },
      { sentiment: "negative", count: toNumber(impact?.negative) }
    ]
  };
}

export function mapTopCategoryImpactToMostAffectedTeams(
  items: ProphetAnalyticsMostAffectedTeamItem[] | undefined,
  teamCodeLookup?: TeamCodeLookup
): MostAffectedTeamData {
  const entries = (items ?? [])
    .map((item, index) => {
      const teamName = item.team ?? "";

      return {
        id: String(item.id ?? item.rank ?? index),
        rank: toNumber(item.rank) || index + 1,
        teamCode: resolveTeamCode(teamName, teamCodeLookup),
        teamName,
        netImpact: parseImpactNumber(item.abs_impact),
        highImpactEventCount: toNumber(item.high_impact)
      };
    })
    .sort((a, b) => a.rank - b.rank);

  return { entries };
}
