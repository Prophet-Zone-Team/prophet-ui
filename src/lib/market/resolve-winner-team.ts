import curatedTeams from "@/data/teams/index";
import { worldCupTeams } from "@/data/teams/world-cup-teams";
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
};

export function resolveWorldCupTeamByCuratedKey(indexKey: string): Team | undefined {
  const worldCupTeam = findWorldCupTeamByName(indexKey);

  if (!worldCupTeam) {
    return undefined;
  }

  const curated = curatedTeams[indexKey as keyof typeof curatedTeams];

  return {
    ...worldCupTeam,
    logoUrl: curated?.logo ?? worldCupTeam.logoUrl,
  };
}

export function resolveWorldCupTeamByGroupItemTitle(groupItemTitle: string): Team | undefined {
  const trimmed = groupItemTitle.trim();

  if (!trimmed) {
    return undefined;
  }

  const curatedKey = resolveCuratedTeamKey(trimmed);
  const curatedEntry = curatedKey
    ? curatedTeamEntries.find(([key]) => key === curatedKey)
    : undefined;

  if (curatedEntry) {
    return resolveWorldCupTeamByCuratedKey(curatedEntry[0]);
  }

  const worldCupTeam = findWorldCupTeamByName(trimmed);

  if (!worldCupTeam) {
    return undefined;
  }

  const curated =
    curatedTeams[worldCupTeam.name as keyof typeof curatedTeams] ??
    curatedTeamEntries.find(([, value]) => value.name === worldCupTeam.name)?.[1];

  return {
    ...worldCupTeam,
    logoUrl: curated?.logo ?? worldCupTeam.logoUrl,
  };
}

function resolveCuratedTeamKey(label: string): string | undefined {
  const direct = curatedTeamEntries.find(([key]) => key === label);

  if (direct) {
    return direct[0];
  }

  const normalized = normalizeGammaSearchText(label);
  const aliasKey = GROUP_TITLE_ALIASES[normalized];

  if (aliasKey && curatedTeams[aliasKey as keyof typeof curatedTeams]) {
    return aliasKey;
  }

  return curatedTeamEntries.find(([key, value]) => {
    const candidates = [key, value.name].map(normalizeGammaSearchText);
    return candidates.some((candidate) => candidate === normalized);
  })?.[0];
}

function findWorldCupTeamByName(name: string): Team | undefined {
  const normalized = normalizeGammaSearchText(name);

  if (!normalized) {
    return undefined;
  }

  return worldCupTeams.find((team) => {
    const candidates = [
      team.name,
      team.code,
      team.id.replace(/-/g, " "),
      ...(team.aliases ?? []),
    ].map(normalizeGammaSearchText);

    return candidates.some((alias) => alias.length > 0 && alias === normalized);
  });
}
