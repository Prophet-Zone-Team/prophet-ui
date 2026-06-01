import type {
  ProphetGameStatisticsPayload,
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

function resolveTeamSide(
  teamName: string,
  homeTeamName: string,
  awayTeamName: string
): "home" | "away" | undefined {
  const normalized = normalizeTeamName(teamName);
  const normalizedHome = normalizeTeamName(homeTeamName);
  const normalizedAway = normalizeTeamName(awayTeamName);

  if (normalized === normalizedHome) {
    return "home";
  }

  if (normalized === normalizedAway) {
    return "away";
  }

  return undefined;
}

function buildStatLookup(
  payload: ProphetGameStatisticsPayload,
  homeTeamName: string,
  awayTeamName: string
): Map<string, { home: number; away: number }> {
  const lookup = new Map<string, { home: number; away: number }>();

  for (const block of payload.statistics) {
    const side = resolveTeamSide(block.team.name, homeTeamName, awayTeamName);

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
  awayTeamName: string
): GameStatisticsRowData[] {
  if (!payload) {
    return buildEmptyGameStatisticsRows();
  }

  const lookup = buildStatLookup(payload, homeTeamName, awayTeamName);

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

function resolveGoalElapsedSeconds(
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
  awayTeamName: string
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
      awayTeamName
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
