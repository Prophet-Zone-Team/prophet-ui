import { parseComboMarketSlug } from "@/lib/combo/map-market-to-combo-item";
import { isMatchTotalMarket } from "@/lib/combo/match-total-combo-rules";
import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";
import type { ComboPickOutcomeSide } from "@/views/combo/combo-widget/types";

export type MatchMoneylineTeamSide = "home" | "away";

export function isMatchMoneylineTeamMarket(
  market: ComboMarketRecord,
): boolean {
  const meta = parseComboMarketSlug(market.slug);

  return (
    meta.marketKind === "moneyline" &&
    isTeamTogglePickCode(meta)
  );
}

export function isHalftimeTeamMarket(market: ComboMarketRecord): boolean {
  const meta = parseComboMarketSlug(market.slug);

  return meta.marketKind === "halftime" && isTeamTogglePickCode(meta);
}

export function isComboTeamToggleMarket(market: ComboMarketRecord): boolean {
  return isMatchMoneylineTeamMarket(market) || isHalftimeTeamMarket(market);
}

export function isComboToggleOutcomeMarket(
  market: ComboMarketRecord,
): boolean {
  return isComboTeamToggleMarket(market) || isMatchTotalMarket(market);
}

/**
 * Persisted pick.outcomeSide and widget toggle value.
 * Moneyline / halftime team: yes = home, no = away.
 * Match total: yes = over, no = under.
 */
export function resolveComboPickStoredOutcomeSide(
  market: ComboMarketRecord,
  selectionOutcomeSide: ComboPickOutcomeSide,
): ComboPickOutcomeSide {
  const meta = parseComboMarketSlug(market.slug);

  if (meta.marketKind === "moneyline" || meta.marketKind === "halftime") {
    if (isHomeTeamTogglePickCode(meta)) {
      return "yes";
    }

    if (isAwayTeamTogglePickCode(meta)) {
      return "no";
    }
  }

  return selectionOutcomeSide;
}

/** RFQ leg outcome derived from stored toggle state. */
export function resolveComboLegOutcomeSide(
  market: ComboMarketRecord,
  storedOutcomeSide: ComboPickOutcomeSide,
): ComboPickOutcomeSide {
  if (isComboTeamToggleMarket(market)) {
    return "yes";
  }

  return storedOutcomeSide;
}

export function resolveMatchMoneylineTeamSide(
  market: ComboMarketRecord,
): MatchMoneylineTeamSide | undefined {
  const meta = parseComboMarketSlug(market.slug);

  if (meta.marketKind !== "moneyline" || !meta.pickCode) {
    return undefined;
  }

  if (isHomeTeamTogglePickCode(meta)) {
    return "home";
  }

  if (isAwayTeamTogglePickCode(meta)) {
    return "away";
  }

  return undefined;
}

export function resolveMatchMoneylineMarket(
  group: ComboGameGroup,
  teamSide: MatchMoneylineTeamSide,
): ComboMarketRecord | undefined {
  return findTeamToggleMarketInGroup(group, "moneyline", teamSide);
}

export function resolveHalftimeTeamMarket(
  group: ComboGameGroup,
  teamSide: MatchMoneylineTeamSide,
): ComboMarketRecord | undefined {
  return findTeamToggleMarketInGroup(group, "halftime", teamSide);
}

export function findComboGameGroupForMarket(
  groups: readonly ComboGameGroup[],
  marketId: string,
): ComboGameGroup | undefined {
  return groups.find((group) =>
    group.markets.some((market) => market.id === marketId),
  );
}

function findTeamToggleMarketInGroup(
  group: ComboGameGroup,
  marketKind: "moneyline" | "halftime",
  teamSide: MatchMoneylineTeamSide,
): ComboMarketRecord | undefined {
  return group.markets.find((market) => {
    const meta = parseComboMarketSlug(market.slug);

    if (meta.marketKind !== marketKind) {
      return false;
    }

    if (teamSide === "home") {
      return isHomeTeamTogglePickCode(meta);
    }

    return isAwayTeamTogglePickCode(meta);
  });
}

function isTeamTogglePickCode(meta: {
  pickCode?: string;
  homeCode: string;
  awayCode: string;
}): boolean {
  return isHomeTeamTogglePickCode(meta) || isAwayTeamTogglePickCode(meta);
}

function isHomeTeamTogglePickCode(meta: {
  pickCode?: string;
  homeCode: string;
}): boolean {
  return meta.pickCode === meta.homeCode || meta.pickCode === "home";
}

function isAwayTeamTogglePickCode(meta: {
  pickCode?: string;
  awayCode: string;
}): boolean {
  return meta.pickCode === meta.awayCode || meta.pickCode === "away";
}
