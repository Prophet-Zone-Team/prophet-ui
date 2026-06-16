import curatedTeams from "@/data/teams/index";
import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import {
  curatedEntryToTeam,
  findCuratedTeamById,
  findCuratedTeamByName,
  isCuratedTeamVisible,
} from "@/data/teams/curated-team-list";
import { normalizeGammaSearchText } from "@/lib/market/polymarket-gamma";
import type { Team } from "@/types/market";

const curatedTeamEntries = Object.entries(curatedTeams) as Array<
  [string, (typeof curatedTeams)[keyof typeof curatedTeams]]
>;

const GROUP_TITLE_ALIASES: Record<string, string> = {
  "united states": "USA",
  usa: "USA",
  usmnt: "USA",
  curacao: "Curaçao",
  "cote d ivoire": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  "dr congo": "Congo DR",
  "democratic republic of the congo": "Congo DR",
  "south korea": "South Korea",
  "korea republic": "South Korea",
  "republic of korea": "South Korea",
  turkiye: "Turkiye",
  turkey: "Turkiye",
  "bosnia and herzegovina": "Bosnia-Herzegovina",
  bosnia: "Bosnia-Herzegovina",
  "czech republic": "Czechia",
  "saudi arabia": "Saudi Arabia",
  "south africa": "South Africa",
  "new zealand": "New Zealand",
  "cape verde": "Cape Verde",
  "cabo verde": "Cape Verde",
  "ir iran": "Iran",
};

export function resolveWorldCupTeamByCuratedKey(indexKey: string): Team | undefined {
  const curated = curatedTeams[indexKey as keyof typeof curatedTeams];

  if (curated) {
    return curatedEntryToTeam(indexKey, curated);
  }

  const byId = findCuratedTeamById(indexKey);

  if (byId) {
    return byId;
  }

  return findCuratedTeamByName(indexKey);
}

export function resolveWorldCupTeamByGroupItemTitle(groupItemTitle: string): Team | undefined {
  const trimmed = groupItemTitle.trim();

  if (!trimmed) {
    return undefined;
  }

  const curatedKey = resolveCuratedTeamKey(trimmed);

  if (curatedKey) {
    return resolveWorldCupTeamByCuratedKey(curatedKey);
  }

  return findCuratedTeamByName(trimmed);
}

export function resolveCanonicalWorldCupTeamId(teamId: string): string {
  const worldCupTeam = getWorldCupTeamByIdOrCode(teamId);

  if (worldCupTeam) {
    return worldCupTeam.id;
  }

  const curated = findCuratedTeamById(teamId);

  if (!curated) {
    return teamId;
  }

  const byCode = getWorldCupTeamByIdOrCode(curated.code);

  return byCode?.id ?? teamId;
}

function resolveCuratedTeamKey(label: string): string | undefined {
  const normalized = normalizeGammaSearchText(label);
  const aliasKey = GROUP_TITLE_ALIASES[normalized];

  if (aliasKey && curatedTeams[aliasKey as keyof typeof curatedTeams]) {
    return aliasKey;
  }

  const direct = curatedTeamEntries.find(([key]) => key === label);

  if (direct && isCuratedTeamVisible(direct[1])) {
    return direct[0];
  }

  const visibleMatch = curatedTeamEntries.find(([key, value]) => {
    if (!isCuratedTeamVisible(value)) {
      return false;
    }

    const candidates = [key, value.name].map(normalizeGammaSearchText);
    return candidates.some((candidate) => candidate === normalized);
  });

  if (visibleMatch) {
    return visibleMatch[0];
  }

  if (direct) {
    return direct[0];
  }

  return curatedTeamEntries.find(([key, value]) => {
    const candidates = [key, value.name].map(normalizeGammaSearchText);
    return candidates.some((candidate) => candidate === normalized);
  })?.[0];
}
