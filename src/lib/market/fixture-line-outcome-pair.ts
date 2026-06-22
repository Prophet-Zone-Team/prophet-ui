import { getFixtureOutcomesForGroup } from "@/lib/market/build-fixture-markets-snapshot";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  OrderOutcomeSide,
} from "@/types/market";

export interface LineOutcomePair {
  yesOutcome: FixtureMarketOutcome;
  noOutcome: FixtureMarketOutcome;
}

export function isLineDualOutcomeMarket(
  outcome: Pick<FixtureMarketOutcome, "marketType">,
): boolean {
  return outcome.marketType === "spread" || outcome.marketType === "total";
}

function resolveLineBinarySide(
  outcome: FixtureMarketOutcome,
  groupType: "spread" | "total",
): OrderOutcomeSide {
  if (groupType === "spread") {
    return outcome.id.endsWith(":no") ? "no" : "yes";
  }

  if (groupType === "total" && outcome.side === "under") {
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

  let yesOutcome: FixtureMarketOutcome | undefined;
  let noOutcome: FixtureMarketOutcome | undefined;

  for (const lineOutcome of lineOutcomes) {
    const binarySide = resolveLineBinarySide(lineOutcome, groupType);

    if (binarySide === "yes") {
      yesOutcome = lineOutcome;
    } else {
      noOutcome = lineOutcome;
    }
  }

  if (!yesOutcome || !noOutcome) {
    return undefined;
  }

  return { yesOutcome, noOutcome };
}

export function resolveLineOutcomeForSide(
  pair: LineOutcomePair,
  binarySide: OrderOutcomeSide,
): FixtureMarketOutcome {
  return binarySide === "yes" ? pair.yesOutcome : pair.noOutcome;
}
