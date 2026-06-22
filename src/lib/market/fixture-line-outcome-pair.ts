import { getFixtureOutcomesForGroup } from "@/lib/market/build-fixture-markets-snapshot";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  OrderOutcomeSide,
} from "@/types/market";

export interface LineOutcomePair {
  /** Spread: home outcome. Total: over outcome. */
  yesOutcome: FixtureMarketOutcome;
  /** Spread: away outcome. Total: under outcome. */
  noOutcome: FixtureMarketOutcome;
}

export function isLineDualOutcomeMarket(
  outcome: Pick<FixtureMarketOutcome, "marketType">,
): boolean {
  return outcome.marketType === "spread" || outcome.marketType === "total";
}

export function resolveLineOutcomeTradeBinarySide(
  outcome: FixtureMarketOutcome,
): OrderOutcomeSide {
  if (outcome.marketType === "spread") {
    return outcome.id.endsWith(":no") ? "no" : "yes";
  }

  if (outcome.marketType === "total" && outcome.side === "under") {
    return "no";
  }

  return "yes";
}

export function resolveLineKeyFromOutcome(
  outcome: FixtureMarketOutcome,
): string | undefined {
  if (outcome.marketType === "spread") {
    if (outcome.conditionId) {
      return `spread:${outcome.conditionId}`;
    }

    const match = outcome.id.match(/^(spread:[^:]+):(yes|no)$/);
    return match?.[1];
  }

  if (outcome.marketType === "total") {
    if (outcome.line !== undefined) {
      return String(outcome.line);
    }

    const match = outcome.id.match(/^total:([^:]+):(over|under)$/);
    return match?.[1];
  }

  return undefined;
}

export function resolveLineOutcomePair(
  outcome: FixtureMarketOutcome,
  fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines">,
): LineOutcomePair | undefined {
  if (!isLineDualOutcomeMarket(outcome)) {
    return undefined;
  }

  const groupType = outcome.marketType as "spread" | "total";
  const group = fixtureMarkets.lines.find((item) => item.type === groupType);

  if (!group) {
    return undefined;
  }

  const lineKey = resolveLineKeyFromOutcome(outcome);

  if (!lineKey) {
    return undefined;
  }

  const lineOutcomes = getFixtureOutcomesForGroup(group, lineKey);

  if (lineOutcomes.length < 2) {
    return undefined;
  }

  if (groupType === "spread") {
    const homeOutcome = lineOutcomes.find((item) => item.side === "home");
    const awayOutcome = lineOutcomes.find((item) => item.side === "away");

    if (!homeOutcome || !awayOutcome) {
      return undefined;
    }

    return { yesOutcome: homeOutcome, noOutcome: awayOutcome };
  }

  const overOutcome = lineOutcomes.find((item) => item.side === "over");
  const underOutcome = lineOutcomes.find((item) => item.side === "under");

  if (!overOutcome || !underOutcome) {
    return undefined;
  }

  return { yesOutcome: overOutcome, noOutcome: underOutcome };
}

export function resolveLineOutcomeForSide(
  pair: LineOutcomePair,
  binarySide: OrderOutcomeSide,
): FixtureMarketOutcome {
  return binarySide === "yes" ? pair.yesOutcome : pair.noOutcome;
}

export function isLineOutcomePairSideActive(
  pair: LineOutcomePair,
  selectedOutcome: Pick<FixtureMarketOutcome, "id"> | null | undefined,
  side: OrderOutcomeSide,
): boolean {
  const targetOutcome = resolveLineOutcomeForSide(pair, side);
  return selectedOutcome?.id === targetOutcome.id;
}
