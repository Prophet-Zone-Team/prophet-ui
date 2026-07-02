import type { StrengthMetric } from "@/lib/team/team-detail-model";
import type { ProphetTeamStatsStrength } from "@/types/prophet-api";
import type { TeamStrengthData } from "@/views/trade/game/stats/team-strength/types";

const STRENGTH_DIMENSION_ORDER = [
  "attack",
  "midfield",
  "defense",
  "form",
  "depth",
  "continuity"
] as const;

function resolveDimensionOrder(key: string): number {
  const index = STRENGTH_DIMENSION_ORDER.indexOf(
    key as (typeof STRENGTH_DIMENSION_ORDER)[number]
  );

  return index === -1 ? STRENGTH_DIMENSION_ORDER.length : index;
}

export function mapTeamStatsStrength(
  strength: ProphetTeamStatsStrength | null | undefined
): TeamStrengthData {
  const dimensions = strength?.dimensions ?? [];

  const metrics: StrengthMetric[] = dimensions
    .slice()
    .sort(
      (left, right) =>
        resolveDimensionOrder(left.key) - resolveDimensionOrder(right.key)
    )
    .map((dimension) => ({
      label: dimension.label,
      value: dimension.score
    }));

  return {
    metrics,
    score: strength?.score
  };
}

export function formatStrengthScore(score: number | undefined): string {
  if (score === undefined || Number.isNaN(score)) {
    return "—";
  }

  return String(Math.round(score * 10) / 10);
}
