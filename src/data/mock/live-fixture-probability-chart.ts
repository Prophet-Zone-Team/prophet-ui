import { formatChartTimestampClockLabel } from "@/lib/market/match-display";
import {
  MOCK_LIVE_FIXTURE_ELAPSED_SECONDS,
} from "@/lib/market/mock-live-fixture-config";
import { parseKickoffTimestampMs } from "@/lib/market/live-fixture-probability-chart";
import type {
  GameFixtureBinaryChartPoint,
  GameFixtureChartPoint,
} from "@/types/market";

const MOCK_SAMPLE_STEP_SECONDS = 5 * 60;

const MOCK_TERNARY_KEYFRAMES = [
  { elapsedMinutes: 0, home: 42, draw: 30, away: 28 },
  { elapsedMinutes: 30, home: 40, draw: 26, away: 34 },
  { elapsedMinutes: 65, home: 48, draw: 22, away: 30 },
] as const;

const MOCK_BINARY_KEYFRAMES = [
  { elapsedMinutes: 0, primary: 52, secondary: 48 },
  { elapsedMinutes: 30, primary: 48, secondary: 52 },
  { elapsedMinutes: 65, primary: 55, secondary: 45 },
] as const;

export interface BuildMockLiveFixtureProbabilityChartInput {
  matchId: string;
  kickoffAt: string;
  chartMode: "ternary" | "binary";
  maxElapsedSeconds?: number;
}

function buildPointTimestamp(
  kickoffAt: string,
  elapsedSeconds: number
): string {
  if (elapsedSeconds <= 0) {
    return kickoffAt;
  }

  const kickoffMs = parseKickoffTimestampMs(kickoffAt);

  if (kickoffMs === undefined) {
    return new Date().toISOString();
  }

  return new Date(kickoffMs + elapsedSeconds * 1000).toISOString();
}

function interpolateValue(
  leftMinute: number,
  leftValue: number,
  rightMinute: number,
  rightValue: number,
  targetMinute: number
): number {
  if (rightMinute === leftMinute) {
    return leftValue;
  }

  const progress = (targetMinute - leftMinute) / (rightMinute - leftMinute);

  return leftValue + (rightValue - leftValue) * progress;
}

function buildElapsedSampleSeconds(maxElapsedSeconds: number): number[] {
  const samples: number[] = [];

  for (
    let elapsedSeconds = 0;
    elapsedSeconds <= maxElapsedSeconds;
    elapsedSeconds += MOCK_SAMPLE_STEP_SECONDS
  ) {
    samples.push(elapsedSeconds);
  }

  return samples;
}

function interpolateTernaryAtMinute(elapsedMinutes: number): {
  home: number;
  draw: number;
  away: number;
} {
  const frames = MOCK_TERNARY_KEYFRAMES;

  if (elapsedMinutes <= frames[0].elapsedMinutes) {
    return {
      home: frames[0].home,
      draw: frames[0].draw,
      away: frames[0].away,
    };
  }

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1];
    const next = frames[index];

    if (elapsedMinutes <= next.elapsedMinutes) {
      return {
        home: interpolateValue(
          previous.elapsedMinutes,
          previous.home,
          next.elapsedMinutes,
          next.home,
          elapsedMinutes
        ),
        draw: interpolateValue(
          previous.elapsedMinutes,
          previous.draw,
          next.elapsedMinutes,
          next.draw,
          elapsedMinutes
        ),
        away: interpolateValue(
          previous.elapsedMinutes,
          previous.away,
          next.elapsedMinutes,
          next.away,
          elapsedMinutes
        ),
      };
    }
  }

  const last = frames[frames.length - 1];

  return {
    home: last.home,
    draw: last.draw,
    away: last.away,
  };
}

function interpolateBinaryAtMinute(elapsedMinutes: number): {
  primary: number;
  secondary: number;
} {
  const frames = MOCK_BINARY_KEYFRAMES;

  if (elapsedMinutes <= frames[0].elapsedMinutes) {
    return {
      primary: frames[0].primary,
      secondary: frames[0].secondary,
    };
  }

  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1];
    const next = frames[index];

    if (elapsedMinutes <= next.elapsedMinutes) {
      return {
        primary: interpolateValue(
          previous.elapsedMinutes,
          previous.primary,
          next.elapsedMinutes,
          next.primary,
          elapsedMinutes
        ),
        secondary: interpolateValue(
          previous.elapsedMinutes,
          previous.secondary,
          next.elapsedMinutes,
          next.secondary,
          elapsedMinutes
        ),
      };
    }
  }

  const last = frames[frames.length - 1];

  return {
    primary: last.primary,
    secondary: last.secondary,
  };
}

export function buildMockLiveFixtureProbabilityChart(
  input: BuildMockLiveFixtureProbabilityChartInput
): {
  chartMode: "ternary" | "binary";
  points: GameFixtureChartPoint[];
  binaryPoints: GameFixtureBinaryChartPoint[];
} {
  const maxElapsedSeconds =
    input.maxElapsedSeconds ?? MOCK_LIVE_FIXTURE_ELAPSED_SECONDS;
  const elapsedSamples = buildElapsedSampleSeconds(maxElapsedSeconds);

  if (input.chartMode === "binary") {
    const binaryPoints = elapsedSamples.map((elapsedSeconds) => {
      const elapsedMinutes = elapsedSeconds / 60;
      const values = interpolateBinaryAtMinute(elapsedMinutes);
      const timestamp = buildPointTimestamp(input.kickoffAt, elapsedSeconds);

      return {
        matchId: input.matchId,
        timestamp,
        label: formatChartTimestampClockLabel(timestamp),
        elapsedSeconds,
        primary: Math.round(values.primary * 10) / 10,
        secondary: Math.round(values.secondary * 10) / 10,
      };
    });

    return {
      chartMode: "binary",
      points: [],
      binaryPoints,
    };
  }

  const points = elapsedSamples.map((elapsedSeconds) => {
    const elapsedMinutes = elapsedSeconds / 60;
    const values = interpolateTernaryAtMinute(elapsedMinutes);
    const timestamp = buildPointTimestamp(input.kickoffAt, elapsedSeconds);

    return {
      matchId: input.matchId,
      timestamp,
      label: formatChartTimestampClockLabel(timestamp),
      elapsedSeconds,
      home: Math.round(values.home * 10) / 10,
      draw: Math.round(values.draw * 10) / 10,
      away: Math.round(values.away * 10) / 10,
    };
  });

  return {
    chartMode: "ternary",
    points,
    binaryPoints: [],
  };
}
