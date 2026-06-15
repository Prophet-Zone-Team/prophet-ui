import teams from "@/data/teams";
import {
  getWorldCupTeamByIdOrCode,
  WORLD_CUP_2026_GROUP_ORDER,
  WORLD_CUP_2026_GROUPS,
  type WorldCup2026Group,
  type WorldCup2026GroupTeam,
} from "@/data/world-cup-2026/groups";
import type { GroupStandings, GroupStandingRow } from "@/types/group-standings";

import { GROUP_ADVANCING_MOCK_OVERRIDES } from "./config";

const WORLD_CUP_TEAM_ID_TO_FLAG_NAME: Record<string, keyof typeof teams> = {
  mexico: "Mexico",
  "south-africa": "South Africa",
  "south-korea": "South Korea",
  czechia: "Czechia",
  canada: "Canada",
  "bosnia-herzegovina": "Bosnia-Herzegovina",
  qatar: "Qatar",
  switzerland: "Switzerland",
  brazil: "Brazil",
  morocco: "Morocco",
  haiti: "Haiti",
  scotland: "Scotland",
  usa: "USA",
  paraguay: "Paraguay",
  australia: "Australia",
  turkiye: "Turkiye",
  germany: "Germany",
  curacao: "Curaçao",
  "ivory-coast": "Ivory Coast",
  ecuador: "Ecuador",
  netherlands: "Netherlands",
  japan: "Japan",
  sweden: "Sweden",
  tunisia: "Tunisia",
  belgium: "Belgium",
  egypt: "Egypt",
  iran: "Iran",
  "new-zealand": "New Zealand",
  spain: "Spain",
  "cape-verde": "Cape Verde",
  "saudi-arabia": "Saudi Arabia",
  uruguay: "Uruguay",
  france: "France",
  senegal: "Senegal",
  iraq: "Iraq",
  norway: "Norway",
  argentina: "Argentina",
  algeria: "Algeria",
  austria: "Austria",
  jordan: "Jordan",
  portugal: "Portugal",
  "congo-dr": "Congo DR",
  uzbekistan: "Uzbekistan",
  colombia: "Colombia",
  england: "England",
  croatia: "Croatia",
  ghana: "Ghana",
  panama: "Panama",
};

function hashTeamId(teamId: string): number {
  let hash = 0;

  for (let index = 0; index < teamId.length; index += 1) {
    hash = (hash * 31 + teamId.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function mockAdvancingProbability(teamId: string): number {
  const override = GROUP_ADVANCING_MOCK_OVERRIDES[teamId];

  if (override !== undefined) {
    return override;
  }

  const hash = hashTeamId(teamId);
  return 20 + (hash % 76);
}

export function resolveGroupTeamDisplay(wcTeam: WorldCup2026GroupTeam): {
  flagName: string;
  teamName: string;
  teamCode: string;
} {
  const mappedKey = WORLD_CUP_TEAM_ID_TO_FLAG_NAME[wcTeam.id];

  if (mappedKey && teams[mappedKey]) {
    const record = teams[mappedKey];

    return {
      flagName: mappedKey,
      teamName: record.name,
      teamCode: wcTeam.code,
    };
  }

  const byAbbreviation = Object.entries(teams).find(
    ([, record]) =>
      record.abbreviation?.toLowerCase() === wcTeam.code.toLowerCase(),
  );

  if (byAbbreviation) {
    const [flagName, record] = byAbbreviation;

    return {
      flagName,
      teamName: record.name,
      teamCode: wcTeam.code,
    };
  }

  const byName = Object.entries(teams).find(
    ([, record]) => record.name.toLowerCase() === wcTeam.name.toLowerCase(),
  );

  if (byName) {
    const [flagName, record] = byName;

    return {
      flagName,
      teamName: record.name,
      teamCode: wcTeam.code,
    };
  }

  return {
    flagName: wcTeam.name,
    teamName: wcTeam.name,
    teamCode: wcTeam.code,
  };
}

function buildGroupStandingRow(wcTeam: WorldCup2026GroupTeam): GroupStandingRow {
  const { flagName, teamName, teamCode } = resolveGroupTeamDisplay(wcTeam);

  return {
    teamId: wcTeam.id,
    teamName,
    flagName,
    teamCode,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    advancingProbability: mockAdvancingProbability(wcTeam.id),
  };
}

export function buildGroupStandingsFromWorldCup(): GroupStandings[] {
  return WORLD_CUP_2026_GROUP_ORDER.map((group) => ({
    group,
    rows: WORLD_CUP_2026_GROUPS[group].map(buildGroupStandingRow),
  }));
}

export function filterGroupsBySearch(
  groups: GroupStandings[],
  query: string,
): GroupStandings[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return groups;
  }

  return groups.filter((group) =>
    group.rows.some(
      (row) =>
        row.teamName.toLowerCase().includes(normalized) ||
        row.teamCode.toLowerCase().includes(normalized),
    ),
  );
}

export function getGroupLabel(
  group: WorldCup2026Group,
  t: (key: "groupLabel", values: { group: WorldCup2026Group }) => string,
): string {
  return t("groupLabel", { group });
}

export function resolveGroupStandingRowTeamId(row: GroupStandingRow): string {
  return (
    getWorldCupTeamByIdOrCode(row.teamCode)?.id ??
    getWorldCupTeamByIdOrCode(row.teamId)?.id ??
    row.teamId
  );
}
