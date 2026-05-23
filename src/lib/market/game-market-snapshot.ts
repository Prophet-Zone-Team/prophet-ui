import {
  attachCachedFootballToMatches,
  getStaticWorldCupMatches
} from "@/data/world-cup-2026/matches";
import type {
  ApiFootballTeamContext,
  GameMarketOutcome,
  GameMarketSnapshot,
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint,
  GameProbabilityHistoryPoint,
  MatchOutcomeSide,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { parseMatchOutcomeOdds } from "@/lib/market/match-outcome-odds";
import { getMatchVolume, resolveMatchSides } from "@/lib/market/schedule-match";

export function findWorldCupMatch(
  matchId: string,
  contexts: ApiFootballTeamContext[] = []
): WorldCupMatch | undefined {
  const matches = attachCachedFootballToMatches(getStaticWorldCupMatches(), contexts);
  return matches.find((match) => match.id === matchId);
}

export function getRelatedMatches(
  match: WorldCupMatch,
  contexts: ApiFootballTeamContext[] = []
): WorldCupMatch[] {
  const matches = attachCachedFootballToMatches(getStaticWorldCupMatches(), contexts);

  if (match.group) {
    return matches.filter(
      (item) => item.group === match.group && item.id !== match.id
    );
  }

  return matches.filter(
    (item) => item.stage === match.stage && item.id !== match.id
  ).slice(0, 6);
}

export function buildGameMarketSnapshot(
  match: WorldCupMatch,
  teamSnapshots: TeamMarketSnapshot[]
): GameMarketSnapshot {
  const sides = resolveMatchSides(match, teamSnapshots);
  const oddsResult = parseMatchOutcomeOdds(match, sides.home.name, sides.away.name);
  const volume = getMatchVolume(match, teamSnapshots);

  let outcomes: GameMarketOutcome[];
  let source: string;

  if (oddsResult.status === "ready") {
    outcomes = buildOutcomesFromOdds(
      oddsResult.probabilities,
      sides.home.name,
      sides.away.name
    );
    source = match.odds?.source ?? "api-football";
  } else {
    outcomes = buildFallbackOutcomes(match, teamSnapshots, sides.home.name, sides.away.name);
    source = "Estimated from winner market probabilities";
  }

  return {
    match,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    outcomes,
    market: {
      volume,
      acceptingOrders: false,
      source,
      freshness: match.freshness
    }
  };
}

function buildOutcomesFromOdds(
  probabilities: { home: number; draw: number; away: number },
  homeName: string,
  awayName: string
): GameMarketOutcome[] {
  return [
    {
      side: "home",
      label: `${homeName} win`,
      probability: Number((probabilities.home * 100).toFixed(1)),
      change24h: pseudoChange("home"),
      volume: undefined
    },
    {
      side: "draw",
      label: "Draw",
      probability: Number((probabilities.draw * 100).toFixed(1)),
      change24h: pseudoChange("draw"),
      volume: undefined
    },
    {
      side: "away",
      label: `${awayName} win`,
      probability: Number((probabilities.away * 100).toFixed(1)),
      change24h: pseudoChange("away"),
      volume: undefined
    }
  ];
}

function buildFallbackOutcomes(
  match: WorldCupMatch,
  teamSnapshots: TeamMarketSnapshot[],
  homeName: string,
  awayName: string
): GameMarketOutcome[] {
  const homeSnapshot = match.homeTeamId
    ? teamSnapshots.find((item) => item.team.id === match.homeTeamId)
    : undefined;
  const awaySnapshot = match.awayTeamId
    ? teamSnapshots.find((item) => item.team.id === match.awayTeamId)
    : undefined;

  const homeStrength = homeSnapshot?.market.probability ?? 18;
  const awayStrength = awaySnapshot?.market.probability ?? 18;
  const total = homeStrength + awayStrength + 28;
  const home = (homeStrength / total) * 100;
  const draw = (28 / total) * 100;
  const away = (awayStrength / total) * 100;

  return buildOutcomesFromOdds(
    { home: home / 100, draw: draw / 100, away: away / 100 },
    homeName,
    awayName
  );
}

function pseudoChange(side: MatchOutcomeSide): number {
  const seed = side === "home" ? 1.2 : side === "draw" ? -0.4 : 0.8;
  return Number(seed.toFixed(1));
}

export function getOutcomeProbability(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide
): number {
  return snapshot.outcomes.find((item) => item.side === side)?.probability ?? 0;
}

export function buildGameProbabilityHistory(
  snapshot: GameMarketSnapshot
): GameProbabilityHistoryPoint[] {
  const { match } = snapshot;

  return snapshot.outcomes.flatMap((outcome) => {
    const base = outcome.probability;
    const drift = outcome.change24h ?? 0;

    return Array.from({ length: 24 }, (_, index) => {
      const offset = index - 23;
      const value =
        base - drift + (drift / 23) * index + Math.sin(index * 0.35 + base) * 0.35;

      return {
        matchId: match.id,
        outcome: outcome.side,
        timestamp:
          offset === 0
            ? new Date().toISOString()
            : new Date(Date.now() + offset * 3_600_000).toISOString(),
        probability: Number(Math.max(0.1, Math.min(99.9, value)).toFixed(1))
      };
    });
  });
}

export function filterGameHistoryByOutcome(
  history: GameProbabilityHistoryPoint[],
  outcome: MatchOutcomeSide
): GameProbabilityHistoryPoint[] {
  return history.filter((point) => point.outcome === outcome);
}

export type GameChartTimeRange = "1H" | "1D" | "1W" | "1M" | "all";

export const GAME_CHART_TIME_RANGES: { id: GameChartTimeRange; label: string }[] = [
  { id: "1H", label: "1H" },
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
];

export function filterGameChartByRange(
  data: GameProbabilityHistoryPoint[],
  range: GameChartTimeRange
): GameProbabilityHistoryPoint[] {
  if (range === "all" || data.length === 0) {
    return data;
  }

  const parsed = data.map((point, index) => ({
    point,
    time: Date.parse(point.timestamp),
    index
  }));

  const hasValidTimes = parsed.some((item) => !Number.isNaN(item.time));

  if (hasValidTimes) {
    const now = Date.now();
    const rangeMs: Record<Exclude<GameChartTimeRange, "all">, number> = {
      "1H": 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "1W": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = now - rangeMs[range];
    const filtered = parsed.filter((item) => item.time >= cutoff).map((item) => item.point);

    if (filtered.length >= 2) {
      return filtered;
    }
  }

  const limits: Record<Exclude<GameChartTimeRange, "all">, number> = {
    "1H": 4,
    "1D": 8,
    "1W": 14,
    "1M": 30
  };

  return data.slice(-limits[range]);
}

const MATCH_MINUTE_MARKS = [
  { minute: 0, minuteLabel: "0'" },
  { minute: 15, minuteLabel: "15'" },
  { minute: 30, minuteLabel: "30'" },
  { minute: 45, minuteLabel: "Half" },
  { minute: 60, minuteLabel: "60'" },
  { minute: 75, minuteLabel: "75'" },
  { minute: 90, minuteLabel: "90'" }
] as const;

export function buildGameMatchMinuteHistory(
  snapshot: GameMarketSnapshot
): GameMatchMinuteHistoryPoint[] {
  const { match } = snapshot;
  const homeFinal = getOutcomeProbability(snapshot, "home");
  const drawFinal = getOutcomeProbability(snapshot, "draw");
  const awayFinal = getOutcomeProbability(snapshot, "away");

  const homeStart = clampProbability(33 + pseudoMinuteOffset(match.id, "home"));
  const drawStart = clampProbability(34 + pseudoMinuteOffset(match.id, "draw"));
  const awayStart = clampProbability(33 + pseudoMinuteOffset(match.id, "away"));

  const lastIndex = MATCH_MINUTE_MARKS.length - 1;

  return MATCH_MINUTE_MARKS.map((mark, index) => {
    const progress = index / lastIndex;
    const curve = 0.5 - Math.cos(progress * Math.PI) / 2;
    const wobble =
      Math.sin(index * 0.9 + homeFinal * 0.05) * 1.5 +
      Math.cos(index * 0.6 + awayFinal * 0.04) * 1.2;

    const home = interpolateOutcome(homeStart, homeFinal, curve, wobble, "home");
    const draw = interpolateOutcome(drawStart, drawFinal, curve, -wobble * 0.6, "draw");
    const away = interpolateOutcome(awayStart, awayFinal, curve, wobble * 0.8, "away");
    const normalized = normalizeMinuteProbabilities(home, draw, away);

    return {
      matchId: match.id,
      minute: mark.minute,
      minuteLabel: mark.minuteLabel,
      home: normalized.home,
      draw: normalized.draw,
      away: normalized.away
    };
  });
}

function interpolateOutcome(
  start: number,
  end: number,
  curve: number,
  wobble: number,
  side: MatchOutcomeSide
): number {
  const drift = start + (end - start) * curve + wobble;
  const sideBias = side === "draw" ? 0.5 : 0;
  return clampProbability(drift + sideBias);
}

function normalizeMinuteProbabilities(home: number, draw: number, away: number) {
  const total = home + draw + away || 1;
  return {
    home: Number(((home / total) * 100).toFixed(1)),
    draw: Number(((draw / total) * 100).toFixed(1)),
    away: Number(((away / total) * 100).toFixed(1))
  };
}

function clampProbability(value: number): number {
  return Number(Math.max(0.1, Math.min(99.9, value)).toFixed(1));
}

function pseudoMinuteOffset(matchId: string, side: MatchOutcomeSide): number {
  const seed = matchId.length + (side === "home" ? 2 : side === "draw" ? 5 : 8);
  return ((seed * 7) % 11) - 5;
}

export function getGameMatchChartEvents(match: WorldCupMatch): GameMatchChartEvent[] {
  const homeGoals = match.homeScore ?? 0;
  const awayGoals = match.awayScore ?? 0;

  if (homeGoals === 0 && awayGoals === 0) {
    return [];
  }

  const homeMinutes = [18, 41, 58, 78];
  const awayMinutes = [27, 52, 71, 86];
  const events: GameMatchChartEvent[] = [];

  for (let index = 0; index < homeGoals; index += 1) {
    events.push({
      minute: homeMinutes[index] ?? 15 + index * 20,
      side: "home",
      type: "goal"
    });
  }

  for (let index = 0; index < awayGoals; index += 1) {
    events.push({
      minute: awayMinutes[index] ?? 20 + index * 22,
      side: "away",
      type: "goal"
    });
  }

  return events.sort((left, right) => left.minute - right.minute);
}

export function getGameChartYDomain(
  data: GameProbabilityHistoryPoint[]
): [number, number] {
  if (data.length === 0) {
    return [0, 100];
  }

  const values = data.map((point) => point.probability);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(2, (max - min) * 0.15);

  return [
    Number(Math.max(0, min - padding).toFixed(1)),
    Number(Math.min(100, max + padding).toFixed(1))
  ];
}
