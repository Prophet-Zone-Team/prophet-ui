import type { ProphetAnalyticsTeamPowerRanking } from "@/types/prophet-api";
import type {
  TeamPowerRankingEntry,
  TeamPowerRankingSignalStatus,
  TeamPowerRankingTrend
} from "@/views/team-power-ranking/types";

import { extractGroupId } from "./map-competitiveness";

export type TeamCodeLookup = Map<string, string>;

export function buildTeamCodeLookup(
  items: ProphetAnalyticsTeamPowerRanking[] | undefined
): TeamCodeLookup {
  const lookup = new Map<string, string>();

  for (const item of items ?? []) {
    if (item.team_name && item.team_code) {
      lookup.set(item.team_name, item.team_code);
    }
  }

  return lookup;
}

function mapTrendDirection(
  direction: string | undefined,
  rankDelta: number | undefined
): TeamPowerRankingTrend {
  if (direction === "up") {
    return "up";
  }

  if (direction === "down") {
    return "down";
  }

  if (direction === "flat") {
    return "neutral";
  }

  if (rankDelta !== undefined && rankDelta > 0) {
    return "up";
  }

  if (rankDelta !== undefined && rankDelta < 0) {
    return "down";
  }

  return "neutral";
}

function trendToSignalStatus(
  trend: TeamPowerRankingTrend
): TeamPowerRankingSignalStatus {
  if (trend === "up") {
    return "positive";
  }

  if (trend === "down") {
    return "negative";
  }

  return "neutral";
}

function parseProbability(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mapTeamPowerRankingResponse(
  items: ProphetAnalyticsTeamPowerRanking[] | undefined
): TeamPowerRankingEntry[] {
  return [...(items ?? [])]
    .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))
    .map((item) => {
      const trend = mapTrendDirection(item.trend_direction, item.rank_delta);
      const teamCode = item.team_code ?? "";
      const id =
        item.id !== undefined
          ? String(item.id)
          : teamCode.toLowerCase() || (item.team_name ?? "unknown");

      return {
        id,
        rank: item.rank ?? 0,
        teamCode,
        teamName: item.team_name ?? "",
        group: extractGroupId(item.group_name),
        titleProbability: parseProbability(item.title_probability),
        roundOf16Probability: parseProbability(item.round_of_16_probability),
        pathDifficulty: "moderate" as const,
        trend,
        signalStatus: trendToSignalStatus(trend)
      };
    });
}

export function resolveTeamCode(
  teamName: string,
  lookup?: TeamCodeLookup
): string {
  const fromLookup = lookup?.get(teamName);

  if (fromLookup) {
    return fromLookup;
  }

  return teamName.slice(0, 3).toUpperCase();
}
