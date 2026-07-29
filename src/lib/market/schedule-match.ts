import { findCuratedTeamById } from "@/data/teams/curated-team-list";
import { resolveCanonicalWorldCupTeamId } from "@/lib/market/resolve-winner-team";
import {
  formatDateFromIso,
  formatKickoffSubtitleFromIso,
} from "@/lib/formatters/datetime";
import type {
  Team,
  TeamMarketSnapshot,
  WorldCupMatch,
  WorldCupMatchStatus
} from "@/types/market";

export type ScheduleRowVariant = "upcoming" | "ongoing" | "ended";

export type ScheduleSortKey = "volume" | "time";

export interface ResolvedMatchTeam {
  name: string;
  code?: string;
  logoUrl?: string;
  snapshot?: TeamMarketSnapshot;
}

export interface ResolvedMatchSides {
  home: ResolvedMatchTeam;
  away: ResolvedMatchTeam;
}

export interface ScheduleFilterTeam {
  id: Team["id"];
  name: string;
  code: string;
}

export interface ScheduleMatchListOptions {
  showEnded: boolean;
  sortKey: ScheduleSortKey;
  teamIds?: Team["id"][];
  liveOnly?: boolean;
  /** When true, skip client ended/active status filter (API already filtered). */
  skipEndedFilter?: boolean;
}

const ENDED_STATUSES = new Set<WorldCupMatchStatus>([
  "finished",
  "postponed",
  "cancelled"
]);

export function isEndedMatchStatus(status: WorldCupMatchStatus): boolean {
  return ENDED_STATUSES.has(status);
}

export function getScheduleRowVariant(
  status: WorldCupMatchStatus
): ScheduleRowVariant {
  if (status === "live") {
    return "ongoing";
  }

  if (isEndedMatchStatus(status)) {
    return "ended";
  }

  return "upcoming";
}

export function resolveMatchSides(
  match: WorldCupMatch,
  snapshots: TeamMarketSnapshot[]
): ResolvedMatchSides {
  const homeSnapshot = match.homeTeamId
    ? snapshots.find((snapshot) => snapshot.team.id === match.homeTeamId)
    : undefined;
  const awaySnapshot = match.awayTeamId
    ? snapshots.find((snapshot) => snapshot.team.id === match.awayTeamId)
    : undefined;
  const homeTeam = match.homeTeamId
    ? findCuratedTeamById(match.homeTeamId)
    : undefined;
  const awayTeam = match.awayTeamId
    ? findCuratedTeamById(match.awayTeamId)
    : undefined;

  return {
    home: {
      name:
        homeSnapshot?.team.name ??
        match.homeDisplayName ??
        match.homeSeed ??
        "TBD",
      code: homeSnapshot?.team.code ?? homeTeam?.code,
      logoUrl: match.homeLogoUrl ?? homeSnapshot?.team.logoUrl ?? homeTeam?.logoUrl,
      snapshot: homeSnapshot
    },
    away: {
      name:
        awaySnapshot?.team.name ??
        match.awayDisplayName ??
        match.awaySeed ??
        "TBD",
      code: awaySnapshot?.team.code ?? awayTeam?.code,
      logoUrl: match.awayLogoUrl ?? awaySnapshot?.team.logoUrl ?? awayTeam?.logoUrl,
      snapshot: awaySnapshot
    }
  };
}

export function getMatchVolume(
  match: WorldCupMatch,
  snapshots: TeamMarketSnapshot[]
): number {
  if (match.polymarket?.volume !== undefined) {
    return match.polymarket.volume;
  }

  return [match.homeTeamId, match.awayTeamId].reduce((sum, teamId) => {
    if (!teamId) {
      return sum;
    }

    const snapshot = snapshots.find((item) => item.team.id === teamId);
    return sum + (snapshot?.market.volume ?? 0);
  }, 0);
}

export function getMatchKickoffTime(match: WorldCupMatch): number {
  if (!match.kickoffAt) {
    return Number.NEGATIVE_INFINITY;
  }

  const time = new Date(match.kickoffAt).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

export interface FindFeaturedScheduleMatchOptions {
  showEnded?: boolean;
}

export function findFeaturedScheduleMatch(
  matches: WorldCupMatch[],
  options: FindFeaturedScheduleMatchOptions = {}
): WorldCupMatch | undefined {
  const { showEnded = false } = options;
  const candidates = filterScheduleMatches(matches, showEnded);
  const liveMatch = candidates.find((match) => match.status === "live");

  if (liveMatch) {
    return liveMatch;
  }

  const now = Date.now();
  let nearest: WorldCupMatch | undefined;

  for (const match of candidates) {
    const kickoff = getMatchKickoffTime(match);

    if (kickoff === Number.NEGATIVE_INFINITY) {
      continue;
    }

    if (!nearest) {
      nearest = match;
      continue;
    }

    const nearestKickoff = getMatchKickoffTime(nearest);
    const delta = Math.abs(kickoff - now);
    const nearestDelta = Math.abs(nearestKickoff - now);

    if (delta < nearestDelta) {
      nearest = match;
      continue;
    }

    if (delta !== nearestDelta) {
      continue;
    }

    const kickoffIsUpcoming = kickoff >= now;
    const nearestIsUpcoming = nearestKickoff >= now;

    if (kickoffIsUpcoming && !nearestIsUpcoming) {
      nearest = match;
      continue;
    }

    if (kickoffIsUpcoming === nearestIsUpcoming) {
      if (kickoffIsUpcoming ? kickoff < nearestKickoff : kickoff > nearestKickoff) {
        nearest = match;
      }
    }
  }

  return nearest;
}

export function formatScheduleKickoff(value: string | undefined): string {
  if (!value) {
    return "TBD";
  }

  return formatKickoffSubtitleFromIso(value);
}

export function filterScheduleMatches(
  matches: WorldCupMatch[],
  showEnded: boolean
): WorldCupMatch[] {
  if (showEnded) {
    return matches.filter((match) => isEndedMatchStatus(match.status));
  }

  return matches.filter((match) => !isEndedMatchStatus(match.status));
}

export function filterScheduleMatchesByLive(
  matches: WorldCupMatch[],
  liveOnly: boolean | undefined
): WorldCupMatch[] {
  if (!liveOnly) {
    return matches;
  }

  return matches.filter((match) => match.status === "live");
}

const EXTERNAL_SCHEDULE_TEAM_ID_PREFIX = "ext:";

function normalizeScheduleTeamNameKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

/** Synthetic id for club/display-name teams without curated World Cup ids. */
export function buildExternalScheduleTeamId(displayName: string): Team["id"] {
  return `${EXTERNAL_SCHEDULE_TEAM_ID_PREFIX}${normalizeScheduleTeamNameKey(displayName)}`;
}

function isExternalScheduleTeamId(teamId: Team["id"]): boolean {
  return teamId.startsWith(EXTERNAL_SCHEDULE_TEAM_ID_PREFIX);
}

function resolveMatchSideScheduleTeamId(
  teamId: Team["id"] | undefined,
  displayName: string | undefined
): Team["id"] | undefined {
  if (teamId) {
    return resolveCanonicalWorldCupTeamId(teamId);
  }

  const trimmed = displayName?.trim();

  if (!trimmed || trimmed === "TBD") {
    return undefined;
  }

  return buildExternalScheduleTeamId(trimmed);
}

function codeFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "UNK";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase();
  }

  return parts
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function resolveScheduleFilterTeam(
  teamId: Team["id"],
  snapshots: TeamMarketSnapshot[],
  matches: WorldCupMatch[]
): ScheduleFilterTeam {
  if (isExternalScheduleTeamId(teamId)) {
    const matchWithTeam = matches.find((match) => {
      const sides = resolveMatchSides(match, snapshots);
      return (
        resolveMatchSideScheduleTeamId(match.homeTeamId, sides.home.name) ===
          teamId ||
        resolveMatchSideScheduleTeamId(match.awayTeamId, sides.away.name) ===
          teamId
      );
    });

    if (matchWithTeam) {
      const sides = resolveMatchSides(matchWithTeam, snapshots);
      const side =
        resolveMatchSideScheduleTeamId(
          matchWithTeam.homeTeamId,
          sides.home.name
        ) === teamId
          ? sides.home
          : sides.away;

      return {
        id: teamId,
        name: side.name,
        code: side.code ?? codeFromDisplayName(side.name)
      };
    }

    const rawName = teamId.slice(EXTERNAL_SCHEDULE_TEAM_ID_PREFIX.length);

    return {
      id: teamId,
      name: rawName,
      code: codeFromDisplayName(rawName)
    };
  }

  const snapshot = snapshots.find((item) => item.team.id === teamId);

  if (snapshot) {
    return {
      id: teamId,
      name: snapshot.team.name,
      code: snapshot.team.code
    };
  }

  const curatedTeam = findCuratedTeamById(teamId);

  if (curatedTeam) {
    return {
      id: teamId,
      name: curatedTeam.name,
      code: curatedTeam.code
    };
  }

  const matchWithTeam = matches.find(
    (match) => match.homeTeamId === teamId || match.awayTeamId === teamId
  );

  if (matchWithTeam) {
    const sides = resolveMatchSides(matchWithTeam, snapshots);
    const side =
      matchWithTeam.homeTeamId === teamId ? sides.home : sides.away;

    return {
      id: teamId,
      name: side.name,
      code: side.code ?? teamId.slice(0, 3).toUpperCase()
    };
  }

  return {
    id: teamId,
    name: teamId,
    code: teamId.slice(0, 3).toUpperCase()
  };
}

export function buildScheduleFilterTeams(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[]
): ScheduleFilterTeam[] {
  const teamIds = new Set<Team["id"]>();

  for (const match of matches) {
    const sides = resolveMatchSides(match, snapshots);
    const homeId = resolveMatchSideScheduleTeamId(
      match.homeTeamId,
      sides.home.name
    );
    const awayId = resolveMatchSideScheduleTeamId(
      match.awayTeamId,
      sides.away.name
    );

    if (homeId) {
      teamIds.add(homeId);
    }

    if (awayId) {
      teamIds.add(awayId);
    }
  }

  return [...teamIds]
    .map((teamId) => resolveScheduleFilterTeam(teamId, snapshots, matches))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function filterScheduleMatchesByTeams(
  matches: WorldCupMatch[],
  teamIds?: Team["id"][],
  snapshots: TeamMarketSnapshot[] = []
): WorldCupMatch[] {
  if (teamIds === undefined) {
    return matches;
  }

  if (teamIds.length === 0) {
    return [];
  }

  const selectedTeamIds = new Set(
    teamIds.map((teamId) =>
      isExternalScheduleTeamId(teamId)
        ? teamId
        : resolveCanonicalWorldCupTeamId(teamId)
    )
  );

  return matches.filter((match) => {
    const sides = resolveMatchSides(match, snapshots);
    const homeTeamId = resolveMatchSideScheduleTeamId(
      match.homeTeamId,
      sides.home.name
    );
    const awayTeamId = resolveMatchSideScheduleTeamId(
      match.awayTeamId,
      sides.away.name
    );
    const homeSelected =
      homeTeamId !== undefined && selectedTeamIds.has(homeTeamId);
    const awaySelected =
      awayTeamId !== undefined && selectedTeamIds.has(awayTeamId);

    return homeSelected || awaySelected;
  });
}

export function resolveScheduleTeamSearchMatches(
  teams: ScheduleFilterTeam[],
  searchQuery: string,
  resolveLocalizedName: (team: ScheduleFilterTeam) => string
): Team["id"][] | null {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  return teams
    .filter((team) => {
      const displayName = resolveLocalizedName(team).toLowerCase();

      return (
        displayName.includes(normalizedQuery) ||
        team.code.toLowerCase().includes(normalizedQuery) ||
        team.name.toLowerCase().includes(normalizedQuery)
      );
    })
    .map((team) => team.id);
}

export function combineScheduleTeamFilterIds(
  selectedTeamIds: Team["id"][],
  searchMatchedTeamIds: Team["id"][] | null
): Team["id"][] | undefined {
  if (!searchMatchedTeamIds) {
    return selectedTeamIds.length > 0 ? selectedTeamIds : undefined;
  }

  if (searchMatchedTeamIds.length === 0) {
    return [];
  }

  if (selectedTeamIds.length === 0) {
    return searchMatchedTeamIds;
  }

  return selectedTeamIds.filter((teamId) =>
    searchMatchedTeamIds.includes(teamId)
  );
}

export function sortScheduleMatches(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[],
  sortKey: ScheduleSortKey,
  options?: { reverseTime?: boolean }
): WorldCupMatch[] {
  return [...matches].sort((left, right) => {
    if (sortKey === "volume") {
      return (
        getMatchVolume(right, snapshots) - getMatchVolume(left, snapshots)
      );
    }

    const timeDelta = getMatchKickoffTime(left) - getMatchKickoffTime(right);
    return options?.reverseTime ? -timeDelta : timeDelta;
  });
}

export function getScheduleDateKey(kickoffAt: string | undefined): string | null {
  if (!kickoffAt) {
    return null;
  }

  const date = new Date(kickoffAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatScheduleDateGroupLabel(kickoffAt: string): string {
  return formatDateFromIso(kickoffAt);
}

export interface ScheduleDateGroup {
  dateKey: string;
  label: string;
  matches: WorldCupMatch[];
}

export function groupScheduleMatchesByDate(
  matches: WorldCupMatch[]
): ScheduleDateGroup[] {
  const groups: ScheduleDateGroup[] = [];

  for (const match of matches) {
    const dateKey = getScheduleDateKey(match.kickoffAt) ?? "unknown";
    const existing = groups.find((group) => group.dateKey === dateKey);

    if (existing) {
      existing.matches.push(match);
      continue;
    }

    const label =
      match.kickoffAt && dateKey !== "unknown"
        ? formatScheduleDateGroupLabel(match.kickoffAt)
        : "Date TBD";

    groups.push({
      dateKey,
      label,
      matches: [match]
    });
  }

  return groups;
}

export function buildScheduleMatchList(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[],
  options: ScheduleMatchListOptions
): WorldCupMatch[] {
  const filteredByStatus = options.skipEndedFilter
    ? matches
    : filterScheduleMatches(matches, options.showEnded);
  const filteredByLive = filterScheduleMatchesByLive(
    filteredByStatus,
    options.liveOnly
  );
  const filteredByTeams = filterScheduleMatchesByTeams(
    filteredByLive,
    options.teamIds,
    snapshots
  );
  return sortScheduleMatches(filteredByTeams, snapshots, options.sortKey, {
    reverseTime: options.showEnded
  });
}

export function buildScheduleDateGroups(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[],
  options: ScheduleMatchListOptions
): ScheduleDateGroup[] | null {
  if (options.sortKey !== "time") {
    return null;
  }

  const sorted = buildScheduleMatchList(matches, snapshots, options);
  return groupScheduleMatchesByDate(sorted);
}
