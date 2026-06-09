import type { ProphetAnalyticsTeamPowerRanking } from "@/types/prophet-api";
import type {
  TeamPowerRankingEntry,
  TeamPowerRankingPathDifficulty,
  TeamPowerRankingSignalStatus,
  TeamPowerRankingTrend
} from "@/views/team-power-ranking/types";

import { extractGroupId } from "./map-competitiveness";

import teamData from "@/data/teams/index";
import { curatedAbbreviationToCode } from "@/data/teams/curated-team-list";
import { buildTeamDetailHref } from "../routes/team";

export type TeamCodeLookup = Map<string, string>;

export function buildTeamCodeLookup(
  items: ProphetAnalyticsTeamPowerRanking[] | undefined
): TeamCodeLookup {
  const lookup = new Map<string, string>();

  for (const item of items ?? []) {
    const currentTeam = teamData[item.team_name as keyof typeof teamData];
    if (item.team_name && currentTeam) {
      lookup.set(item.team_name, curatedAbbreviationToCode(currentTeam.abbreviation));
    }
  }

  return lookup;
}

function mapTrendDirection(
  direction: string | undefined
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

  return "new";
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
      const currentTeam = teamData[item.team_name as keyof typeof teamData];
      const trend = mapTrendDirection(item.recent_trend);
      const teamCode = currentTeam ? curatedAbbreviationToCode(currentTeam.abbreviation) : "";
      const id =
        item.id !== undefined
          ? String(item.id)
          : teamCode.toLowerCase() || (item.team_name ?? "unknown");

      const teamNameMap: Record<string, string> = {
        "Türkiye": "Turkiye",
        "Bosnia & Herzegovina": "Bosnia-Herzegovina",
        "Cape Verde Islands": "Cape Verde",
      };
      const teamName = item.team_name ? (teamNameMap[item.team_name] ?? item.team_name) : "";
      const teamLink = buildTeamDetailHref(item.team_name);

      return {
        id,
        rank: item.rank ?? 0,
        teamCode,
        teamName,
        group: extractGroupId(item.group_name),
        titleProbability: parseProbability(item.title_probability),
        roundOf16Probability: parseProbability(item.round_of_16_probability),
        pathDifficulty: (item.path_difficulty_label ?? "Medium") as TeamPowerRankingPathDifficulty,
        trend,
        signalStatus: (item.signal_status ?? "Positive") as TeamPowerRankingSignalStatus,
        link: teamLink,
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
