import {
  isExactScoreMarket,
  isHalftimeMarket,
  isMoneylineMarket,
  isSpreadMarket,
  removeOtherMarketsOfKind,
} from "@/lib/combo/combo-market-mutex";
import { isMatchTotalMarket, removeConflictingMatchTotalPicks } from "@/lib/combo/match-total-combo-rules";
import type { ComboGameGroup } from "@/types/combo";

export function applyComboMarketPickUpdate<T extends { id: string; outcomeSide?: string }>(
  picks: readonly T[],
  marketId: string,
  outcomeSide: string,
  createPick: () => T,
): T[] {
  const existingPick = picks.find((pick) => pick.id === marketId);
  const existingOutcomeSide =
    existingPick && "outcomeSide" in existingPick
      ? existingPick.outcomeSide
      : existingPick
        ? "yes"
        : undefined;

  if (existingOutcomeSide === outcomeSide) {
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

  if (!market) {
    return applyComboMarketPickUpdate(picks, marketId, outcomeSide, createPick);
  }

  let nextPicks = [...picks];

  if (isMoneylineMarket(market)) {
    nextPicks = removeOtherMarketsOfKind(nextPicks, group, "moneyline", marketId);
    nextPicks = removeOtherMarketsOfKind(nextPicks, group, "spread", marketId);
  } else if (isSpreadMarket(market)) {
    nextPicks = removeOtherMarketsOfKind(nextPicks, group, "spread", marketId);
    nextPicks = removeOtherMarketsOfKind(nextPicks, group, "moneyline", marketId);
  } else if (isExactScoreMarket(market)) {
    nextPicks = removeOtherMarketsOfKind(nextPicks, group, "exact_score", marketId);
  } else if (isHalftimeMarket(market)) {
    nextPicks = removeOtherMarketsOfKind(nextPicks, group, "halftime", marketId);
  } else if (isMatchTotalMarket(market)) {
    nextPicks = removeConflictingMatchTotalPicks(
      nextPicks,
      group,
      marketId,
      outcomeSide,
    );
  }

  return applyComboMarketPickUpdate(
    nextPicks,
    marketId,
    outcomeSide,
    createPick,
  );
}
