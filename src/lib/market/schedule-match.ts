import type {
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
  options: { showEnded: boolean; sortKey: ScheduleSortKey }
): WorldCupMatch[] {
  const filtered = filterScheduleMatches(matches, options.showEnded);
  return sortScheduleMatches(filtered, snapshots, options.sortKey);
}

export function buildScheduleDateGroups(
  matches: WorldCupMatch[],
  snapshots: TeamMarketSnapshot[],
  options: { showEnded: boolean; sortKey: ScheduleSortKey }
): ScheduleDateGroup[] | null {
  if (options.sortKey !== "time") {
    return null;
  }

  const sorted = buildScheduleMatchList(matches, snapshots, options);
  return groupScheduleMatchesByDate(sorted);
}
