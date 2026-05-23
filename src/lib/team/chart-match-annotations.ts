import { formatMatchScore } from "../market/match-display";
import { resolveMatchSides } from "../market/schedule-match";
import { getRelatedMatchesForTeam } from "./related-matches";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "../../types/market";

export interface TeamChartMatchAnnotation {
  matchId: string;
  chartIndex: number;
  date: string;
  probability: number;
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  scoreLabel: string;
  matchLabel: string;
}

const MAX_MATCH_OFFSET_MS = 7 * 24 * 60 * 60 * 1000;

function formatTeamCode(code: string | undefined, fallback: string): string {
  if (!code) {
    return fallback.slice(0, 3).toUpperCase();
  }

  return code.slice(0, 3).toUpperCase();
}

export function buildTeamChartMatchAnnotations({
  teamId,
  matches,
  chartData,
  snapshots
}: {
  teamId: string;
  matches: WorldCupMatch[];
  chartData: ProbabilityHistoryPoint[];
  snapshots: TeamMarketSnapshot[];
}): TeamChartMatchAnnotation[] {
  if (chartData.length === 0) {
    return [];
  }

  const chartTimes = chartData.map((point, index) => ({
    index,
    time: Date.parse(point.date),
    date: point.date,
    probability: point.probability
  }));

  const chartStart = Math.min(
    ...chartTimes
      .map((item) => item.time)
      .filter((time) => !Number.isNaN(time))
  );
  const chartEnd = Math.max(
    ...chartTimes
      .map((item) => item.time)
      .filter((time) => !Number.isNaN(time))
  );

  const finishedMatches = getRelatedMatchesForTeam(teamId, matches).filter(
    (match) =>
      match.status === "finished" &&
      match.homeScore !== undefined &&
      match.awayScore !== undefined &&
      match.kickoffAt
  );

  const annotations: TeamChartMatchAnnotation[] = [];

  for (const match of finishedMatches) {
    const kickoffTime = Date.parse(match.kickoffAt!);

    if (Number.isNaN(kickoffTime)) {
      continue;
    }

    if (
      !Number.isNaN(chartStart) &&
      !Number.isNaN(chartEnd) &&
      (kickoffTime < chartStart - MAX_MATCH_OFFSET_MS ||
        kickoffTime > chartEnd + MAX_MATCH_OFFSET_MS)
    ) {
      continue;
    }

    let nearest = chartTimes[0];
    let nearestDelta = Number.POSITIVE_INFINITY;

    for (const point of chartTimes) {
      if (Number.isNaN(point.time)) {
        continue;
      }

      const delta = Math.abs(point.time - kickoffTime);

      if (delta < nearestDelta) {
        nearestDelta = delta;
        nearest = point;
      }
    }

    if (nearestDelta > MAX_MATCH_OFFSET_MS) {
      continue;
    }

    const sides = resolveMatchSides(match, snapshots);
    const homeCode = formatTeamCode(sides.home.code, sides.home.name);
    const awayCode = formatTeamCode(sides.away.code, sides.away.name);
    const scoreLabel = formatMatchScore(match.homeScore, match.awayScore);

    annotations.push({
      matchId: match.id,
      chartIndex: nearest.index,
      date: nearest.date,
      probability: nearest.probability,
      homeCode,
      awayCode,
      homeName: sides.home.name,
      awayName: sides.away.name,
      scoreLabel,
      matchLabel: `${homeCode} ${scoreLabel} ${awayCode}`
    });
  }

  const usedIndexes = new Set<number>();

  return annotations.filter((annotation) => {
    if (usedIndexes.has(annotation.chartIndex)) {
      return false;
    }

    usedIndexes.add(annotation.chartIndex);
    return true;
  });
}

export function findAnnotationForChartPoint(
  annotations: TeamChartMatchAnnotation[],
  date: string
): TeamChartMatchAnnotation | undefined {
  return annotations.find((annotation) => annotation.date === date);
}
