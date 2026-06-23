import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import {
  resolveCanonicalWorldCupTeamId,
  resolveWorldCupTeamByGroupItemTitle,
} from "@/lib/market/resolve-winner-team";
import type { ProphetGetWinnerProbabilityData } from "@/types/prophet-api";
import type { Team } from "@/types/market";

const WINNER_PROBABILITY_TEAM_ID_OVERRIDES: Record<string, Team["id"]> = {
  "Bosnia-Herzegovina": "bosnia-herzegovina",
};

function resolveWinnerProbabilityTeamId(apiTeamName: string): Team["id"] | undefined {
  const trimmed = apiTeamName.trim();
  const overrideId = WINNER_PROBABILITY_TEAM_ID_OVERRIDES[trimmed];

  if (overrideId && getWorldCupTeamByIdOrCode(overrideId)) {
    return overrideId;
  }

  const team = resolveWorldCupTeamByGroupItemTitle(trimmed);

  if (!team) {
    return undefined;
  }

  const canonicalId = resolveCanonicalWorldCupTeamId(team.id);

  return getWorldCupTeamByIdOrCode(canonicalId) ? canonicalId : undefined;
}

function parseWinnerProbabilityDecimal(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

export function formatWinnerProbabilityLabel(percent: number): string {
  const formatted = percent.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted}%`;
}

export function mapWinnerProbabilityByTeamId(
  data: ProphetGetWinnerProbabilityData | undefined,
): Map<string, number> {
  const map = new Map<string, number>();

  if (!data?.length) {
    return map;
  }

  for (const item of data) {
    const decimal = parseWinnerProbabilityDecimal(item.probability);

    if (decimal === undefined) {
      continue;
    }

    const teamId = resolveWinnerProbabilityTeamId(item.team);

    if (!teamId) {
      continue;
    }

    map.set(teamId, decimal * 100);
  }

  return map;
}
