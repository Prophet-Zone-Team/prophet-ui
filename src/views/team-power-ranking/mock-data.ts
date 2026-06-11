import { mockTeams } from "@/data/mock/teams";

import type {
  TeamPowerRankingEntry,
  TeamPowerRankingFilters,
  TeamPowerRankingPathDifficulty,
  TeamPowerRankingSignalStatus,
  TeamPowerRankingTrend
} from "./types";

export const TEAM_POWER_RANKING_PREVIEW_COUNT = 6;

const TEAM_GROUPS = Object.fromEntries(
  mockTeams.map((team) => [team.id, team.group])
) as Record<string, string>;

const HARD_PATH_TEAM_IDS = new Set([
  "england",
  "netherlands",
  "croatia",
  "morocco",
  "denmark",
  "ghana"
]);

function trendToSignalStatus(
  trend: TeamPowerRankingTrend
): TeamPowerRankingSignalStatus {
  if (trend === "up") return "Positive";
  if (trend === "down") return "Negative";
  return "Neutral";
}

type RawEntry = {
  id: string;
  rank: number;
  teamCode: string;
  teamName: string;
  titleProbability: number;
  roundOf16Probability: number;
  trend: TeamPowerRankingTrend;
};

function buildEntry(raw: RawEntry): TeamPowerRankingEntry {
  const pathDifficulty: TeamPowerRankingPathDifficulty = HARD_PATH_TEAM_IDS.has(
    raw.id
  )
    ? "Hard"
    : "Medium";

  return {
    ...raw,
    group: TEAM_GROUPS[raw.id] ?? "A",
    pathDifficulty,
    signalStatus: trendToSignalStatus(raw.trend),
    link: "",
  };
}

const rawEntries: RawEntry[] = [
  {
    id: "brazil",
    rank: 1,
    teamCode: "BRA",
    teamName: "Brazil",
    titleProbability: 18.2,
    roundOf16Probability: 92,
    trend: "up"
  },
  {
    id: "france",
    rank: 2,
    teamCode: "FRA",
    teamName: "France",
    titleProbability: 15.6,
    roundOf16Probability: 89,
    trend: "up"
  },
  {
    id: "spain",
    rank: 3,
    teamCode: "ESP",
    teamName: "Spain",
    titleProbability: 9.9,
    roundOf16Probability: 81,
    trend: "up"
  },
  {
    id: "england",
    rank: 4,
    teamCode: "ENG",
    teamName: "England",
    titleProbability: 8.6,
    roundOf16Probability: 78,
    trend: "down"
  },
  {
    id: "argentina",
    rank: 5,
    teamCode: "ARG",
    teamName: "Argentina",
    titleProbability: 7.4,
    roundOf16Probability: 73,
    trend: "down"
  },
  {
    id: "germany",
    rank: 6,
    teamCode: "GER",
    teamName: "Germany",
    titleProbability: 6.8,
    roundOf16Probability: 71,
    trend: "down"
  },
  {
    id: "portugal",
    rank: 7,
    teamCode: "POR",
    teamName: "Portugal",
    titleProbability: 6.2,
    roundOf16Probability: 69,
    trend: "up"
  },
  {
    id: "netherlands",
    rank: 8,
    teamCode: "NED",
    teamName: "Netherlands",
    titleProbability: 5.4,
    roundOf16Probability: 67,
    trend: "down"
  },
  {
    id: "italy",
    rank: 9,
    teamCode: "ITA",
    teamName: "Italy",
    titleProbability: 4.9,
    roundOf16Probability: 64,
    trend: "up"
  },
  {
    id: "belgium",
    rank: 10,
    teamCode: "BEL",
    teamName: "Belgium",
    titleProbability: 4.3,
    roundOf16Probability: 62,
    trend: "down"
  },
  {
    id: "uruguay",
    rank: 11,
    teamCode: "URU",
    teamName: "Uruguay",
    titleProbability: 3.8,
    roundOf16Probability: 58,
    trend: "neutral"
  },
  {
    id: "croatia",
    rank: 12,
    teamCode: "CRO",
    teamName: "Croatia",
    titleProbability: 3.5,
    roundOf16Probability: 56,
    trend: "down"
  },
  {
    id: "usa",
    rank: 13,
    teamCode: "USA",
    teamName: "United States",
    titleProbability: 3.1,
    roundOf16Probability: 54,
    trend: "up"
  },
  {
    id: "mexico",
    rank: 14,
    teamCode: "MEX",
    teamName: "Mexico",
    titleProbability: 2.8,
    roundOf16Probability: 52,
    trend: "down"
  },
  {
    id: "japan",
    rank: 15,
    teamCode: "JPN",
    teamName: "Japan",
    titleProbability: 2.5,
    roundOf16Probability: 49,
    trend: "up"
  },
  {
    id: "morocco",
    rank: 16,
    teamCode: "MAR",
    teamName: "Morocco",
    titleProbability: 2.2,
    roundOf16Probability: 47,
    trend: "down"
  },
  {
    id: "colombia",
    rank: 17,
    teamCode: "COL",
    teamName: "Colombia",
    titleProbability: 2.0,
    roundOf16Probability: 45,
    trend: "up"
  },
  {
    id: "denmark",
    rank: 18,
    teamCode: "DEN",
    teamName: "Denmark",
    titleProbability: 1.8,
    roundOf16Probability: 43,
    trend: "down"
  },
  {
    id: "switzerland",
    rank: 19,
    teamCode: "SUI",
    teamName: "Switzerland",
    titleProbability: 1.6,
    roundOf16Probability: 41,
    trend: "neutral"
  },
  {
    id: "senegal",
    rank: 20,
    teamCode: "SEN",
    teamName: "Senegal",
    titleProbability: 1.4,
    roundOf16Probability: 39,
    trend: "down"
  },
  {
    id: "south-korea",
    rank: 21,
    teamCode: "KOR",
    teamName: "South Korea",
    titleProbability: 1.2,
    roundOf16Probability: 36,
    trend: "up"
  },
  {
    id: "australia",
    rank: 22,
    teamCode: "AUS",
    teamName: "Australia",
    titleProbability: 1.0,
    roundOf16Probability: 34,
    trend: "down"
  },
  {
    id: "canada",
    rank: 23,
    teamCode: "CAN",
    teamName: "Canada",
    titleProbability: 0.9,
    roundOf16Probability: 32,
    trend: "up"
  },
  {
    id: "ghana",
    rank: 24,
    teamCode: "GHA",
    teamName: "Ghana",
    titleProbability: 0.8,
    roundOf16Probability: 30,
    trend: "down"
  }
];

export const teamPowerRankingEntries: TeamPowerRankingEntry[] =
  rawEntries.map(buildEntry);

export function getTeamPowerRankingPreview(
  entries: TeamPowerRankingEntry[] = teamPowerRankingEntries,
  count: number = TEAM_POWER_RANKING_PREVIEW_COUNT
): TeamPowerRankingEntry[] {
  return entries.slice(0, count);
}

export function filterTeamPowerRankingEntries(
  entries: TeamPowerRankingEntry[],
  filters: TeamPowerRankingFilters
): TeamPowerRankingEntry[] {
  return entries.filter((entry) => {
    if (filters.teamId !== "all" && entry.id !== filters.teamId) {
      return false;
    }
    if (filters.group !== "all" && entry.group !== filters.group) {
      return false;
    }
    return true;
  });
}

export function getTeamFilterOptions(
  entries: TeamPowerRankingEntry[] = teamPowerRankingEntries
): { value: string; label: string }[] {
  return [
    { value: "all", label: "All" },
    ...entries.map((entry) => ({
      value: entry.id,
      label: entry.teamName
    }))
  ];
}

export const GROUP_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G" },
  { value: "H", label: "H" }
] as const;

export function getTitleOddsMax(
  entries: TeamPowerRankingEntry[]
): number {
  return Math.max(...entries.map((entry) => entry.titleProbability), 1);
}

export function getAdvanceOddsMax(
  entries: TeamPowerRankingEntry[]
): number {
  return Math.max(...entries.map((entry) => entry.roundOf16Probability), 1);
}
