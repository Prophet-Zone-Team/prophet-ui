import { resolveTeamCode } from "@/lib/analytics/map-team-power-ranking";
import { normalizePriceChange } from "@/lib/market/normalize-price-change";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import type { ProphetGetPolymarketStatsData } from "@/types/prophet-api";
import type { Team } from "@/types/market";

export interface PolymarketStatsTopMove {
  team?: Team;
  teamCode: string;
  teamName: string;
  changePercent?: number;
}

function parseNumericString(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

export function parsePolymarketStatsVolume(
  data: ProphetGetPolymarketStatsData | undefined,
): number | undefined {
  return parseNumericString(data?.volume);
}

export function parsePolymarketStatsTopMove(
  data: ProphetGetPolymarketStatsData | undefined,
): PolymarketStatsTopMove | undefined {
  const teamName = data?.oneDayPriceChangeTeam?.trim();

  if (!teamName) {
    return undefined;
  }

  const rawChange = parseNumericString(data?.oneDayPriceChange);
  const changePercent =
    rawChange === undefined ? undefined : normalizePriceChange(rawChange);
  const team = resolveWorldCupTeamByGroupItemTitle(teamName);

  return {
    team,
    teamCode: team?.code ?? resolveTeamCode(teamName),
    teamName: team?.name ?? teamName,
    changePercent,
  };
}
