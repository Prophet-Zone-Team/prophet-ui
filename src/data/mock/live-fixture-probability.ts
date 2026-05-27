import { formatMatchMinuteAxisLabel } from "@/lib/market/match-display";
import { resolveFixtureOutcomesForTab } from "@/lib/market/fixture-tab-outcomes";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import type {
  FixtureChartKind,
  FixtureMarketOutcome,
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  GameMatchChartEvent,
  MatchOutcomeSide,
  WorldCupMatch,
} from "@/types/market";

const MOCK_GOAL_EVENTS: GameMatchChartEvent[] = [
  { elapsedSeconds: 852, side: "home", type: "goal" },
  { elapsedSeconds: 1620, side: "away", type: "goal" },
  { elapsedSeconds: 2280, side: "home", type: "goal" },
];

const POINT_INTERVAL_SECONDS = 60;

export interface LiveFixtureChartData {
  chartMode: "ternary" | "binary";
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
  events: GameMatchChartEvent[];
}

export interface BuildMockLiveFixtureChartInput {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  chartKind: FixtureChartKind;
  lineKey?: string;
  maxElapsedSecondsOverride?: number;
  tickIndex?: number;
}

export function buildMockLiveFixtureChart(
  input: BuildMockLiveFixtureChartInput,
): LiveFixtureChartData {
  const maxElapsedSeconds = resolveMaxElapsedSeconds(
    input.match,
    input.maxElapsedSecondsOverride,
  );
  const tickWobble = (input.tickIndex ?? 0) * 0.35;
  const elapsedMarks = buildElapsedMarks(maxElapsedSeconds);
  const events = filterEventsWithinElapsed(MOCK_GOAL_EVENTS, maxElapsedSeconds);

  if (input.chartKind === "total" || input.chartKind === "spread") {
    const outcomes = resolveBinaryOutcomes(input);
    const primaryFinal = clampProbability(
      (outcomes[0]?.probability ?? 50) + tickWobble,
    );
    const secondaryFinal = clampProbability(
      (outcomes[1]?.probability ?? 50) - tickWobble * 0.6,
    );
    const primaryStart = clampProbability(primaryFinal - pseudoOffset(input.match.id, "primary"));
    const secondaryStart = clampProbability(
      secondaryFinal - pseudoOffset(input.match.id, "secondary"),
    );

    const binaryPoints = elapsedMarks.map((elapsedSeconds, index) => {
      const progress = index / Math.max(elapsedMarks.length - 1, 1);
      const curve = 0.5 - Math.cos(progress * Math.PI) / 2;
      const wobble = Math.sin(index * 0.8) * 1.4;

      const primary = interpolateValue(primaryStart, primaryFinal, curve, wobble);
      const secondary = interpolateValue(
        secondaryStart,
        secondaryFinal,
        curve,
        -wobble * 0.7,
      );
      const normalized = normalizeBinaryValues(primary, secondary);

      return {
        matchId: input.match.id,
        timestamp: String(elapsedSeconds),
        label: formatMatchMinuteAxisLabel(elapsedSeconds),
        elapsedSeconds,
        primary: normalized.primary,
        secondary: normalized.secondary,
      };
    });

    return {
      chartMode: "binary",
      points: [],
      binaryPoints,
      events,
    };
  }

  const homeFinal = clampProbability(
    getSnapshotProbability(input.gameSnapshot, "home") + tickWobble,
  );
  const drawFinal = clampProbability(
    getSnapshotProbability(input.gameSnapshot, "draw") - tickWobble * 0.4,
  );
  const awayFinal = clampProbability(
    getSnapshotProbability(input.gameSnapshot, "away") + tickWobble * 0.5,
  );
  const homeStart = clampProbability(33 + pseudoOffset(input.match.id, "home"));
  const drawStart = clampProbability(34 + pseudoOffset(input.match.id, "draw"));
  const awayStart = clampProbability(33 + pseudoOffset(input.match.id, "away"));

  const points = elapsedMarks.map((elapsedSeconds, index) => {
    const progress = index / Math.max(elapsedMarks.length - 1, 1);
    const curve = 0.5 - Math.cos(progress * Math.PI) / 2;
    const wobble =
      Math.sin(index * 0.9 + homeFinal * 0.05) * 1.5 +
      Math.cos(index * 0.6 + awayFinal * 0.04) * 1.2;

    const home = interpolateValue(homeStart, homeFinal, curve, wobble);
    const draw = interpolateValue(drawStart, drawFinal, curve, -wobble * 0.6);
    const away = interpolateValue(awayStart, awayFinal, curve, wobble * 0.8);
    const normalized = normalizeTernaryValues(home, draw, away);

    return {
      matchId: input.match.id,
      timestamp: String(elapsedSeconds),
      label: formatMatchMinuteAxisLabel(elapsedSeconds),
      elapsedSeconds,
      home: normalized.home,
      draw: normalized.draw,
      away: normalized.away,
    };
  });

  return {
    chartMode: "ternary",
    points,
    binaryPoints: [],
    events,
  };
}

function resolveMaxElapsedSeconds(
  match: WorldCupMatch,
  override?: number,
): number {
  if (override !== undefined) {
    return Math.max(override, 15 * 60);
  }

  return Math.max(match.liveElapsedSeconds ?? 45 * 60, 15 * 60);
}

function buildElapsedMarks(maxElapsedSeconds: number): number[] {
  const marks: number[] = [];

  for (
    let elapsedSeconds = 0;
    elapsedSeconds <= maxElapsedSeconds;
    elapsedSeconds += POINT_INTERVAL_SECONDS
  ) {
    marks.push(elapsedSeconds);
  }

  if (marks[marks.length - 1] !== maxElapsedSeconds) {
    marks.push(maxElapsedSeconds);
  }

  return marks;
}

function filterEventsWithinElapsed(
  events: GameMatchChartEvent[],
  maxElapsedSeconds: number,
): GameMatchChartEvent[] {
  return events.filter((event) => event.elapsedSeconds <= maxElapsedSeconds);
}

function resolveBinaryOutcomes(
  input: BuildMockLiveFixtureChartInput,
): FixtureMarketOutcome[] {
  const tab: GameMarketTabId =
    input.chartKind === "total" ? "totals" : "spreads";

  return resolveFixtureOutcomesForTab(
    input.fixtureMarkets,
    tab,
    input.lineKey,
  ).slice(0, 2);
}

function getSnapshotProbability(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide,
): number {
  return snapshot.outcomes.find((item) => item.side === side)?.probability ?? 33.3;
}

function interpolateValue(
  start: number,
  end: number,
  curve: number,
  wobble: number,
): number {
  return clampProbability(start + (end - start) * curve + wobble);
}

function normalizeTernaryValues(home: number, draw: number, away: number) {
  const total = home + draw + away || 1;

  return {
    home: Number(((home / total) * 100).toFixed(1)),
    draw: Number(((draw / total) * 100).toFixed(1)),
    away: Number(((away / total) * 100).toFixed(1)),
  };
}

function normalizeBinaryValues(primary: number, secondary: number) {
  const total = primary + secondary || 1;

  return {
    primary: Number(((primary / total) * 100).toFixed(1)),
    secondary: Number(((secondary / total) * 100).toFixed(1)),
  };
}

function clampProbability(value: number): number {
  return Number(Math.max(0.1, Math.min(99.9, value)).toFixed(1));
}

function pseudoOffset(matchId: string, key: string): number {
  const seed = matchId.length + key.length * 3;
  return ((seed * 7) % 11) - 5;
}
