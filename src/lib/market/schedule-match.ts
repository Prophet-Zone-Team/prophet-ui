import { worldCupTeams } from "@/data/teams/world-cup-teams";
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

  return {
    home: {
      name:
        homeSnapshot?.team.name ??
        match.homeDisplayName ??
        match.homeSeed ??
        "TBD",
      code: homeSnapshot?.team.code,
      snapshot: homeSnapshot
    },
    away: {
      name:
        awaySnapshot?.team.name ??
        match.awayDisplayName ??
        match.awaySeed ??
        "TBD",
      code: awaySnapshot?.team.code,
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

export function formatScheduleKickoff(value: string | undefined): string {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${hours}:${minutes} ${month}/${day}`;
}

export function filterScheduleMatches(
  matches: WorldCupMatch[],
  showEnded: boolean
): WorldCupMatch[] {
  if (showEnded) {
    return matches;
  }

  return matches.filter((match) => !isEndedMatchStatus(match.status));
}

const worldCupTeamsById = new Map(worldCupTeams.map((team) => [team.id, team]));

function resolveScheduleFilterTeam(
  teamId: Team["id"],
  snapshots: TeamMarketSnapshot[],
  matches: WorldCupMatch[]
): ScheduleFilterTeam {
  const snapshot = snapshots.find((item) => item.team.id === teamId);

  if (snapshot) {
    return {
      id: teamId,
      name: snapshot.team.name,
      code: snapshot.team.code
    };
  }

  const worldCupTeam = worldCupTeamsById.get(teamId);

  if (worldCupTeam) {
    return {
      id: teamId,
      name: worldCupTeam.name,
      code: worldCupTeam.code
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
    if (match.homeTeamId) {
      teamIds.add(match.homeTeamId);
    }

    if (match.awayTeamId) {
      teamIds.add(match.awayTeamId);
    }
  }

  return [...teamIds]
    .map((teamId) => resolveScheduleFilterTeam(teamId, snapshots, matches))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function filterScheduleMatchesByTeams(
  matches: WorldCupMatch[],
  teamIds: Team["id"][]
): WorldCupMatch[] {
  if (teamIds.length === 0) {
    return matches;
  }

  const selectedTeamIds = new Set(teamIds);

  return matches.filter((match) => {
    const homeSelected =
      match.homeTeamId !== undefined && selectedTeamIds.has(match.homeTeamId);
    const awaySelected =
      match.awayTeamId !== undefined && selectedTeamIds.has(match.awayTeamId);

    return homeSelected || awaySelected;
  });
}

export function sortScheduleMatches(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[],
  sortKey: ScheduleSortKey
): WorldCupMatch[] {
  return [...matches].sort((left, right) => {
    if (sortKey === "volume") {
      return (
        getMatchVolume(right, snapshots) - getMatchVolume(left, snapshots)
      );
    }

    return getMatchKickoffTime(left) - getMatchKickoffTime(right);
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
  const date = new Date(kickoffAt);

  if (Number.isNaN(date.getTime())) {
    return kickoffAt;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric"
  });
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
  const filteredByStatus = filterScheduleMatches(matches, options.showEnded);
  const filteredByTeams = filterScheduleMatchesByTeams(
    filteredByStatus,
    options.teamIds ?? []
  );
  return sortScheduleMatches(filteredByTeams, snapshots, options.sortKey);
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
