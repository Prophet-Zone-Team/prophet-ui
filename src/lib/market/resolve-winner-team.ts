import curatedTeams from "@/data/teams/index";
import { normalizeGammaSearchText } from "@/lib/market/polymarket-gamma";
import type { Team, TeamRegion } from "@/types/market";

const curatedTeamEntries = Object.entries(curatedTeams) as Array<
  [string, (typeof curatedTeams)[keyof typeof curatedTeams]]
>;

function curatedTeamKeyToId(key: string): string {
  return normalizeGammaSearchText(key).replace(/\s+/g, "-");
}

function mapContinentToRegion(continent: string): TeamRegion {
  if (continent === "Oceania") {
    return "Asia";
  }

  return continent as TeamRegion;
}

function curatedAbbreviationToCode(abbreviation: string): string {
  const lower = abbreviation.trim().toLowerCase();

  if (lower === "kr") {
    return "KOR";
  }

  return lower.toUpperCase();
}

function curatedEntryToTeam(
  key: string,
  entry: (typeof curatedTeams)[keyof typeof curatedTeams],
): Team {
  return {
    id: curatedTeamKeyToId(key),
    name: entry.name,
    code: curatedAbbreviationToCode(entry.abbreviation),
    region: mapContinentToRegion(entry.continent),
    logoUrl: entry.logo,
    qualifiedStatus: "qualified",
  };
}

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
  const curated = curatedTeams[indexKey as keyof typeof curatedTeams];

  if (curated) {
    return curatedEntryToTeam(indexKey, curated);
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

function findCuratedTeamByName(name: string): Team | undefined {
  const normalized = normalizeGammaSearchText(name);

  if (!normalized) {
    return undefined;
  }

  const match = curatedTeamEntries.find(([key, value]) => {
    const candidates = [
      key,
      value.name,
      value.abbreviation,
      curatedTeamKeyToId(key).replace(/-/g, " "),
    ].map(normalizeGammaSearchText);

    return candidates.some((alias) => alias.length > 0 && alias === normalized);
  });

  return match ? curatedEntryToTeam(match[0], match[1]) : undefined;
}
