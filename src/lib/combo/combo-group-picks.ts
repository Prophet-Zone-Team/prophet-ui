import { isMatchTotalMarket, removeConflictingMatchTotalPicks } from "@/lib/combo/match-total-combo-rules";
import type { ComboGameGroup } from "@/types/combo";

export function applyComboMarketPickUpdate<T extends { id: string; outcomeSide?: string }>(
  picks: readonly T[],
  marketId: string,
  outcomeSide: string,
  createPick: () => T,
): T[] {
  const existingPick = picks.find((pick) => pick.id === marketId);

  if (existingPick?.outcomeSide === outcomeSide) {
    return picks.filter((pick) => pick.id !== marketId);
  }

  return [...picks.filter((pick) => pick.id !== marketId), createPick()];
}

export function applyComboGameGroupPickUpdate<
  T extends { id: string; outcomeSide?: string },
>(
  picks: readonly T[],
  group: ComboGameGroup,
  marketId: string,
  outcomeSide: string,
  createPick: () => T,
): T[] {
  const market = group.markets.find((entry) => entry.id === marketId);

  if (!market || !isMatchTotalMarket(market)) {
    return applyComboMarketPickUpdate(picks, marketId, outcomeSide, createPick);
  }

  const picksWithoutConflictingTotals = removeConflictingMatchTotalPicks(
    picks,
    group,
    marketId,
    outcomeSide,
  );

  return applyComboMarketPickUpdate(
    picksWithoutConflictingTotals,
    marketId,
    outcomeSide,
    createPick,
  );
}
