import {
  getFixtureLineOptions,
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes,
} from "@/lib/market/build-fixture-markets-snapshot";
import {
  isValidAskPrice,
  resolveFixtureBuyAsk,
} from "@/lib/market/fixture-ask-liquidity";
import type {
  FixtureMarketGroup,
  FixtureMarketOutcome,
  FixtureSportsMarketType,
  GameFixtureMarketsSnapshot,
} from "@/types/market";
import type { LineOutcomeButtonVariant } from "@/views/trade/game/fixture-markets/line-outcome-button";

export type GameMarketTabId =
  | "moneyline"
  | "totals"
  | "spreads"
  | "halftime"
  | "top_scores";

export function findFixtureGroupByType(
  groups: FixtureMarketGroup[],
  type: FixtureSportsMarketType,
): FixtureMarketGroup | undefined {
  return groups.find((group) => group.type === type);
}

function probabilityToAskPrice(probability: number | undefined): number | undefined {
  if (probability === undefined || !Number.isFinite(probability)) {
    return undefined;
  }

  const price = probability / 100;
  return isValidAskPrice(price) ? price : undefined;
}

/** Live CLOB ask used for order validation. */
export function resolveOutcomePrice(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no" = "yes",
): number | undefined {
  return resolveFixtureBuyAsk(outcome, binarySide);
}

/** Display price for market action buttons; falls back to snapshot probability. */
export function resolveOutcomeDisplayPrice(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no" = "yes",
): number | undefined {
  const ask = resolveFixtureBuyAsk(outcome, binarySide);

  if (ask !== undefined) {
    return ask;
  }

  if (binarySide === "yes") {
    if (isValidAskPrice(outcome.price)) {
      return outcome.price;
    }

    return probabilityToAskPrice(outcome.probability);
  }

  if (isValidAskPrice(outcome.price)) {
    const noPrice = 1 - outcome.price;
    return isValidAskPrice(noPrice) ? noPrice : undefined;
  }

  if (outcome.probability !== undefined) {
    return probabilityToAskPrice(100 - outcome.probability);
  }

  return undefined;
}

export function isOutcomeBuyable(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no",
): boolean {
  return resolveOutcomePrice(outcome, binarySide) !== undefined;
}

export function resolveMoneylineVariant(
  outcome: FixtureMarketOutcome,
): LineOutcomeButtonVariant {
  if (outcome.side === "draw") {
    return "draw";
  }

  if (outcome.side === "away") {
    return "away";
  }

  return "home";
}

export function resolveSpreadVariant(
  outcome: FixtureMarketOutcome,
): LineOutcomeButtonVariant {
  return outcome.side === "away" ? "away" : "home";
}

export function resolveTotalVariant(
  outcome: FixtureMarketOutcome,
): LineOutcomeButtonVariant {
  return outcome.side === "under" ? "under" : "over";
}

export function resolveLineBinarySide(
  outcome: FixtureMarketOutcome,
  groupType: "spread" | "total",
): "yes" | "no" {
  if (groupType === "spread") {
    return outcome.id.endsWith(":no") ? "no" : "yes";
  }

  if (groupType === "total" && outcome.side === "under") {
    return "no";
  }

  return "yes";
}

export function isOutcomeSelected(
  outcome: FixtureMarketOutcome,
  binarySide: "yes" | "no",
  selectedOutcomeId?: string,
  selectedBinarySide?: "yes" | "no",
): boolean {
  return (
    selectedOutcomeId === outcome.id &&
    (binarySide === undefined || selectedBinarySide === binarySide)
  );
}

export function outcomeBelongsToTab(
  outcome: FixtureMarketOutcome,
  tab: GameMarketTabId,
): boolean {
  switch (tab) {
    case "moneyline":
      return outcome.marketType === "moneyline";
    case "totals":
      return outcome.marketType === "total";
    case "spreads":
      return outcome.marketType === "spread";
    case "halftime":
      return outcome.marketType === "halftime";
    case "top_scores":
      return outcome.marketType === "exact_score";
    default:
      return false;
  }
}

export function resolveDefaultOutcomeForTab(
  fixtureMarkets: GameFixtureMarketsSnapshot,
  tab: GameMarketTabId,
  lineKey?: string,
): FixtureMarketOutcome | undefined {
  switch (tab) {
    case "moneyline": {
      const group = findFixtureGroupByType(fixtureMarkets.lines, "moneyline");
      return (
        group?.outcomes.find((item) => item.side === "home") ?? group?.outcomes[0]
      );
    }
    case "totals": {
      const group = findFixtureGroupByType(fixtureMarkets.lines, "total");
      if (!group) {
        return undefined;
      }
      const outcomes = sortFixtureGroupOutcomes(
        getFixtureOutcomesForGroup(group, lineKey ?? group.defaultLineKey),
        "total",
      );
      return outcomes.find((item) => item.side === "over") ?? outcomes[0];
    }
    case "spreads": {
      const group = findFixtureGroupByType(fixtureMarkets.lines, "spread");
      if (!group) {
        return undefined;
      }
      const outcomes = sortFixtureGroupOutcomes(
        getFixtureOutcomesForGroup(group, lineKey ?? group.defaultLineKey),
        "spread",
      );
      return outcomes.find((item) => item.side === "home") ?? outcomes[0];
    }
    case "halftime":
      return (
        fixtureMarkets.halftime.find((item) => item.side === "home") ??
        fixtureMarkets.halftime[0]
      );
    case "top_scores":
      return fixtureMarkets.exactScores[0];
    default:
      return undefined;
  }
}

export function resolveDefaultLineKey(
  group: FixtureMarketGroup | undefined,
): string | undefined {
  if (!group) {
    return undefined;
  }

  return (
    group.defaultLineKey ??
    getFixtureLineOptions(group)[0]?.key ??
    (group.defaultLine !== undefined ? String(group.defaultLine) : undefined)
  );
}

export function resolveTabChartKind(
  tab: GameMarketTabId,
): "moneyline" | "halftime" | "total" | "spread" | undefined {
  switch (tab) {
    case "moneyline":
      return "moneyline";
    case "halftime":
      return "halftime";
    case "totals":
      return "total";
    case "spreads":
      return "spread";
    default:
      return undefined;
  }
}

export interface OrderbookTokenFallback {
  tokenId?: string;
  noTokenId?: string;
}

export function resolveOrderbookTokenId(
  selectedOutcome: FixtureMarketOutcome | null,
  binarySide: "yes" | "no",
  fallback?: OrderbookTokenFallback,
): string | undefined {
  if (selectedOutcome) {
    return binarySide === "yes"
      ? selectedOutcome.tokenId
      : selectedOutcome.noTokenId;
  }

  if (!fallback) {
    return undefined;
  }

  return binarySide === "yes"
    ? fallback.tokenId
    : fallback.noTokenId ?? fallback.tokenId;
}
