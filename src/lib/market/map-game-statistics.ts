import {
  findCuratedTeamByCode,
  findCuratedTeamByName
} from "@/data/teams/curated-team-list";
import {
  getTeamNameAliases,
  normalizeTeamAlias
} from "@/config/team-name-aliases";
import { normalizeTeamCode } from "@/lib/i18n/localized-team-name";
import type { Team } from "@/types/market";
import type {
  ProphetGameStatisticsPayload,
  ProphetGameStatisticsStatus,
  ProphetGameStatisticValue
} from "@/types/prophet-api";
import type { GameMatchChartEvent } from "@/types/market";

export const GAME_STATISTIC_LABELS = [
  "Possession",
  "Shots",
  "Shots on Target",
  "Shots off Target",
  "Fouls",
  "Yellow Cards",
  "Red Cards",
  "Corners",
  "Free Kicks"
] as const;

export type GameStatisticLabel = (typeof GAME_STATISTIC_LABELS)[number];

export type GameStatisticsRowData = {
  label: GameStatisticLabel;
  homeValue: number;
  awayValue: number;
};

const API_STAT_TYPE_BY_LABEL: Record<GameStatisticLabel, string | undefined> =
  {
    Possession: "Ball Possession",
    Shots: "Total Shots",
    "Shots on Target": "Shots on Goal",
    "Shots off Target": "Shots off Goal",
    Fouls: "Fouls",
    "Yellow Cards": "Yellow Cards",
    "Red Cards": "Red Cards",
    Corners: "Corner Kicks",
    "Free Kicks": undefined
  };

function normalizeTeamName(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+fc\.?$/i, "")
    .trim();
}

export function parseStatisticValue(value: ProphetGameStatisticValue): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return 0;
    }

    const numeric = Number(trimmed.replace(/%$/, ""));

    return Number.isFinite(numeric) ? numeric : 0;
  }

  return 0;
}

function resolveCuratedTeam(
  teamName: string,
  explicitCode?: string
): Team | undefined {
  const normalizedExplicit = normalizeTeamCode(explicitCode);

  if (normalizedExplicit) {
    return findCuratedTeamByCode(normalizedExplicit);
  }

  return findCuratedTeamByName(teamName) ?? findCuratedTeamByCode(teamName);
}

function resolveCuratedTeamCode(
  teamName: string,
  explicitCode?: string
): string | undefined {
  const normalizedExplicit = normalizeTeamCode(explicitCode);

  if (normalizedExplicit) {
    return normalizedExplicit;
  }

  const curatedTeam = resolveCuratedTeam(teamName);

  return normalizeTeamCode(curatedTeam?.code);
}

function buildNormalizedAliasSet(
  teamName: string,
  curatedTeam?: Team
): Set<string> {
  const aliases = new Set<string>([normalizeTeamAlias(teamName)]);

  if (curatedTeam) {
    for (const alias of getTeamNameAliases(curatedTeam)) {
      aliases.add(alias);
    }
  }

  return aliases;
}

function resolveTeamSideByAliasOverlap(
  teamName: string,
  homeTeamName: string,
  awayTeamName: string,
  options?: {
    homeCode?: string;
    awayCode?: string;
  }
): "home" | "away" | undefined {
  const homeTeam = resolveCuratedTeam(homeTeamName, options?.homeCode);
  const awayTeam = resolveCuratedTeam(awayTeamName, options?.awayCode);
  const eventTeam = resolveCuratedTeam(teamName);
  const eventAliases = buildNormalizedAliasSet(teamName, eventTeam);

  if (homeTeam) {
    const homeAliases = buildNormalizedAliasSet(homeTeamName, homeTeam);

    if ([...eventAliases].some((alias) => homeAliases.has(alias))) {
      return "home";
    }
  }

  if (awayTeam) {
    const awayAliases = buildNormalizedAliasSet(awayTeamName, awayTeam);

    if ([...eventAliases].some((alias) => awayAliases.has(alias))) {
      return "away";
    }
  }

  return undefined;
}

export type ResolveTeamSideOptions = {
  homeCode?: string;
  awayCode?: string;
  /** API-Football team id from statistics payload `team.id`. */
  teamId?: number;
  homeApiTeamId?: number;
  awayApiTeamId?: number;
};

function resolveTeamSideByApiId(
  teamId: number | undefined,
  homeApiTeamId: number | undefined,
  awayApiTeamId: number | undefined
): "home" | "away" | undefined {
  if (typeof teamId !== "number" || !Number.isFinite(teamId)) {
    return undefined;
  }

  if (
    typeof homeApiTeamId === "number" &&
    Number.isFinite(homeApiTeamId) &&
    teamId === homeApiTeamId
  ) {
    return "home";
  }

  if (
    typeof awayApiTeamId === "number" &&
    Number.isFinite(awayApiTeamId) &&
    teamId === awayApiTeamId
  ) {
    return "away";
  }

  return undefined;
}

export function resolveTeamSide(
  teamName: string,
  homeTeamName: string,
  awayTeamName: string,
  options?: ResolveTeamSideOptions
): "home" | "away" | undefined {
  const byApiId = resolveTeamSideByApiId(
    options?.teamId,
    options?.homeApiTeamId,
    options?.awayApiTeamId
  );

  if (byApiId) {
    return byApiId;
  }

  const normalized = normalizeTeamName(teamName);
  const normalizedHome = normalizeTeamName(homeTeamName);
  const normalizedAway = normalizeTeamName(awayTeamName);

  if (normalized === normalizedHome) {
    return "home";
  }

  if (normalized === normalizedAway) {
    return "away";
  }

  const eventCode = resolveCuratedTeamCode(teamName);
  const homeCode = resolveCuratedTeamCode(homeTeamName, options?.homeCode);
  const awayCode = resolveCuratedTeamCode(awayTeamName, options?.awayCode);

  if (eventCode && homeCode && eventCode === homeCode) {
    return "home";
  }

  if (eventCode && awayCode && eventCode === awayCode) {
    return "away";
  }

  return resolveTeamSideByAliasOverlap(
    teamName,
    homeTeamName,
    awayTeamName,
    options
  );
}

export type GameStatisticsTeamSides = {
  homeTeamName: string;
  awayTeamName: string;
  homeApiTeamId?: number;
  awayApiTeamId?: number;
};

function buildStatLookup(
  payload: ProphetGameStatisticsPayload,
  sides: GameStatisticsTeamSides
): Map<string, { home: number; away: number }> {
  const lookup = new Map<string, { home: number; away: number }>();

  for (const block of payload.statistics) {
    const side = resolveTeamSide(
      block.team.name,
      sides.homeTeamName,
      sides.awayTeamName,
      {
        teamId: block.team.id,
        homeApiTeamId: sides.homeApiTeamId,
        awayApiTeamId: sides.awayApiTeamId
      }
    );

    if (!side) {
      continue;
    }

    for (const item of block.statistics) {
      const key = item.type.trim();
      const parsedValue = parseStatisticValue(item.value);
      const existing = lookup.get(key) ?? { home: 0, away: 0 };

      if (side === "home") {
        existing.home = parsedValue;
      } else {
        existing.away = parsedValue;
      }

      lookup.set(key, existing);
    }
  }

  return lookup;
}

export function buildEmptyGameStatisticsRows(): GameStatisticsRowData[] {
  return GAME_STATISTIC_LABELS.map((label) => ({
    label,
    homeValue: 0,
    awayValue: 0
  }));
}

export function mapGameStatisticsRows(
  payload: ProphetGameStatisticsPayload | undefined,
  homeTeamName: string,
  awayTeamName: string,
  options?: {
    homeApiTeamId?: number;
    awayApiTeamId?: number;
  }
): GameStatisticsRowData[] {
  if (!payload) {
    return buildEmptyGameStatisticsRows();
  }

  const lookup = buildStatLookup(payload, {
    homeTeamName,
    awayTeamName,
    homeApiTeamId: options?.homeApiTeamId,
    awayApiTeamId: options?.awayApiTeamId
  });

  return GAME_STATISTIC_LABELS.map((label) => {
    const apiType = API_STAT_TYPE_BY_LABEL[label];

    if (!apiType) {
      return { label, homeValue: 0, awayValue: 0 };
    }

    const values = lookup.get(apiType) ?? { home: 0, away: 0 };

    return {
      label,
      homeValue: values.home,
      awayValue: values.away
    };
  });
}

export function buildEmptyGameStatisticsGoalEvents(): GameMatchChartEvent[] {
  return [];
}

/** Announced stoppage minutes from live match status, e.g. 6 → display "+6". */
export function resolveMatchStoppageExtraMinutes(
  status: ProphetGameStatisticsStatus | undefined
): number | undefined {
  const extra = status?.extra;

  if (
    extra === null ||
    extra === undefined ||
    !Number.isFinite(extra) ||
    extra <= 0
  ) {
    return undefined;
  }

  return Math.floor(extra);
}

/**
 * Map statistics event time to chart x-axis seconds (game elapsed since kickoff).
 * `elapsed` and `extra` are match-clock minutes (API-Football), e.g. 12' → 12, 90+6 → 90 and 6.
 */
export function resolveGoalElapsedSeconds(
  elapsed: number,
  extra: number | null | undefined
): number {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const safeExtra =
    extra !== null && extra !== undefined && Number.isFinite(extra)
      ? Math.max(0, extra)
      : 0;

  return (safeElapsed + safeExtra) * 60;
}

export function mapGameStatisticsGoalEvents(
  payload: ProphetGameStatisticsPayload | undefined,
  homeTeamName: string,
  awayTeamName: string,
  options?: {
    homeApiTeamId?: number;
    awayApiTeamId?: number;
  }
): GameMatchChartEvent[] {
  if (!payload?.events?.length) {
    return buildEmptyGameStatisticsGoalEvents();
  }

  const goalEvents: GameMatchChartEvent[] = [];

  for (const event of payload.events) {
    if (event.type !== "Goal") {
      continue;
    }

    const side = resolveTeamSide(
      event.team.name,
      homeTeamName,
      awayTeamName,
      {
        teamId: event.team.id,
        homeApiTeamId: options?.homeApiTeamId,
        awayApiTeamId: options?.awayApiTeamId
      }
    );

    if (!side) {
      continue;
    }

    goalEvents.push({
      elapsedSeconds: resolveGoalElapsedSeconds(
        event.time.elapsed,
        event.time.extra
      ),
      side,
      type: "goal"
    });
  }

  return goalEvents.sort(
    (left, right) => left.elapsedSeconds - right.elapsedSeconds
  );
}
