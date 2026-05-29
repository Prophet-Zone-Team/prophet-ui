import curatedTeams from "@/data/teams/index";
import { normalizeGammaSearchText } from "@/lib/market/polymarket-gamma";
import type { Team, TeamRegion } from "@/types/market";

const curatedTeamEntries = Object.entries(curatedTeams) as Array<
  [string, (typeof curatedTeams)[keyof typeof curatedTeams]]
>;

export function curatedTeamKeyToId(key: string): string {
  return normalizeGammaSearchText(key).replace(/\s+/g, "-");
}

function mapContinentToRegion(continent: string): TeamRegion {
  if (continent === "Oceania") {
    return "Asia";
  }

  return continent as TeamRegion;
}

export function curatedAbbreviationToCode(abbreviation: string): string {
  const lower = abbreviation.trim().toLowerCase();

  if (lower === "kr") {
    return "KOR";
  }

  return lower.toUpperCase();
}

export function curatedEntryToTeam(
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

function isClubCuratedKey(key: string): boolean {
  return key.includes(" FC");
}

function buildCuratedTeamsList(): Team[] {
  return curatedTeamEntries.map(([key, entry]) => curatedEntryToTeam(key, entry));
}

function buildCuratedNationalTeamsList(): Team[] {
  const teams: Team[] = [];
  const seenAbbreviations = new Set<string>();

  for (const [key, entry] of curatedTeamEntries) {
    if (isClubCuratedKey(key)) {
      continue;
    }

    const abbreviation = entry.abbreviation.toLowerCase();

    if (seenAbbreviations.has(abbreviation)) {
      continue;
    }

    seenAbbreviations.add(abbreviation);
    teams.push(curatedEntryToTeam(key, entry));
  }

  return teams;
}

export const curatedTeamsList = buildCuratedTeamsList();
export const curatedNationalTeamsList = buildCuratedNationalTeamsList();
export const CURATED_TEAM_COUNT = curatedTeamsList.length;
export const CURATED_NATIONAL_TEAM_COUNT = curatedNationalTeamsList.length;

export const curatedTeamsById = new Map(
  curatedTeamsList.map((team) => [team.id, team]),
);

export function findCuratedTeamById(teamId: string): Team | undefined {
  return curatedTeamsById.get(teamId);
}

export function findCuratedTeamByCode(code: string): Team | undefined {
  const normalized = code.trim().toLowerCase();

  return curatedTeamsList.find(
    (team) => team.code.toLowerCase() === normalized,
  );
}

export function findCuratedTeamByName(name: string): Team | undefined {
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

export function findCuratedTeamByFuzzyLabel(value: string): Team | undefined {
  const normalized = normalizeGammaSearchText(value);

  if (!normalized) {
    return undefined;
  }

  return curatedTeamsList.find((team) => {
    const candidates = [team.name, team.code, team.id.replace(/-/g, " ")].map(
      normalizeGammaSearchText,
    );

    return candidates.some(
      (candidate) =>
        candidate.length > 0 &&
        (normalized === candidate ||
          normalized.includes(candidate) ||
          candidate.includes(normalized)),
    );
  });
}
