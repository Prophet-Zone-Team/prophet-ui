import { parseComboMarketSlug } from "@/lib/combo/map-market-to-combo-item";
import type { ComboCatalogMarketKind } from "@/lib/combo/map-market-to-combo-item";
import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";

export function resolveMarketKind(market: ComboMarketRecord): ComboCatalogMarketKind {
  return parseComboMarketSlug(market.slug).marketKind;
}

export function isMoneylineMarket(market: ComboMarketRecord): boolean {
  return resolveMarketKind(market) === "moneyline";
}

export function isSpreadMarket(market: ComboMarketRecord): boolean {
  return resolveMarketKind(market) === "spread";
}

export function isExactScoreMarket(market: ComboMarketRecord): boolean {
  return resolveMarketKind(market) === "exact_score";
}

export function resolveMarketIdsByKind(
  group: ComboGameGroup,
  marketKind: ComboCatalogMarketKind,
): string[] {
  return group.markets
    .filter((market) => resolveMarketKind(market) === marketKind)
    .map((market) => market.id);
}

export function resolveSelectedMarketIdByKind(
  groupPicks: readonly { id: string }[],
  group: ComboGameGroup,
  marketKind: ComboCatalogMarketKind,
): string | undefined {
  const marketIds = new Set(resolveMarketIdsByKind(group, marketKind));

  return groupPicks.find((pick) => marketIds.has(pick.id))?.id;
}

export function hasSelectedMarketKind(
  groupPicks: readonly { id: string }[],
  group: ComboGameGroup,
  marketKind: ComboCatalogMarketKind,
): boolean {
  return resolveSelectedMarketIdByKind(groupPicks, group, marketKind) !== undefined;
}

export function removeOtherMarketsOfKind<
  T extends { id: string; outcomeSide?: string },
>(
  picks: readonly T[],
  group: ComboGameGroup,
  marketKind: ComboCatalogMarketKind,
  keepMarketId: string,
): T[] {
  const marketIds = new Set(resolveMarketIdsByKind(group, marketKind));

  return picks.filter((pick) => !marketIds.has(pick.id) || pick.id === keepMarketId);
}
