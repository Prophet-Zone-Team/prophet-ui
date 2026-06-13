import {
  findCuratedTeamByFuzzyLabel,
  findCuratedTeamByName,
} from "@/data/teams/curated-team-list";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { parseOutcomePrices } from "@/lib/analytics/map-team-market-news";
import type { GroupStandings, GroupStandingRow } from "@/types/group-standings";
import type {
  ProphetGetGroupStandingsData,
  ProphetGroupStandingTeam,
} from "@/types/prophet-api";

const VALID_GROUP_CODES = new Set<string>([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
]);

function isWorldCup2026Group(code: string): code is WorldCup2026Group {
  return VALID_GROUP_CODES.has(code);
}

function resolveTeamDisplay(team: ProphetGroupStandingTeam): {
  flagName: string;
  teamCode: string;
} {
  const curated =
    findCuratedTeamByName(team.team_name) ??
    findCuratedTeamByFuzzyLabel(team.team_name);

  if (curated) {
    return {
      flagName: curated.name,
      teamCode: curated.code,
    };
  }

  const fallbackCode = team.team_name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();

  return {
    flagName: team.team_name,
    teamCode: fallbackCode || "UNK",
  };
}

function mapGroupStandingTeam(team: ProphetGroupStandingTeam): GroupStandingRow {
  const { flagName, teamCode } = resolveTeamDisplay(team);
  const prices = parseOutcomePrices(team.outcomePrices);
  const advancingProbability = (prices[0] ?? 0) * 100;

  return {
    teamId: String(team.team_id),
    teamName: team.team_name,
    flagName,
    teamCode,
    logoUrl: team.team_logo || undefined,
    played: team.played,
    wins: team.win,
    draws: team.draw,
    losses: team.lose,
    points: team.points,
    advancingProbability,
  };
}

export function mapGroupStandingsResponse(
  data: ProphetGetGroupStandingsData,
): GroupStandings[] {
  return (data.groups ?? [])
    .flatMap((group) => {
      if (!isWorldCup2026Group(group.group_code)) {
        return [];
      }

      return [
        {
          group: group.group_code,
          rows: [...group.teams]
            .sort((left, right) => left.rank - right.rank)
            .map(mapGroupStandingTeam),
        },
      ];
    });
}
