import {
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes,
} from "@/lib/market/build-fixture-markets-snapshot";
import { resolveEsportsOutcomePair } from "@/lib/market/map-prophet-esports-markets";
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
  return (
    outcome.marketType === "spread" ||
    outcome.marketType === "total" ||
    outcome.marketType === "team_to_advance" ||
    outcome.marketType === "esports_match_winner" ||
    outcome.marketType === "esports_game_winner" ||
    outcome.marketType === "esports_handicap"
  );
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

/** CLOB token used to price a spread/total line outcome button. */
export function resolveLineOutcomeTradeTokenId(
  outcome: Pick<
    FixtureMarketOutcome,
    "id" | "marketType" | "side" | "tokenId" | "noTokenId"
  >,
): string | undefined {
  if (outcome.marketType === "spread") {
    if (!outcome.tokenId || !outcome.noTokenId) {
      return outcome.tokenId;
    }

    return outcome.id.endsWith(":yes")
      ? outcome.tokenId
      : outcome.noTokenId;
  }

  if (outcome.marketType === "total" && outcome.side === "under") {
    return outcome.noTokenId ?? outcome.tokenId;
  }

  return outcome.tokenId;
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

function resolveTeamAdvanceOutcomePair(
  fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines">,
): LineOutcomePair | undefined {
  const group = fixtureMarkets.lines.find(
    (item) => item.type === "team_to_advance",
  );

  if (!group) {
    return undefined;
  }

  const sortedOutcomes = sortFixtureGroupOutcomes(
    group.outcomes,
    "team_to_advance",
  );

  if (sortedOutcomes.length < 2) {
    return undefined;
  }

  let homeOutcome = sortedOutcomes.find((item) => item.side === "home");
  let awayOutcome = sortedOutcomes.find((item) => item.side === "away");

  if (!homeOutcome && !awayOutcome) {
    homeOutcome = sortedOutcomes[0];
    awayOutcome = sortedOutcomes[1];
  } else if (!awayOutcome) {
    awayOutcome = sortedOutcomes.find((item) => item.id !== homeOutcome?.id);
  }

  if (!homeOutcome || !awayOutcome) {
    return undefined;
  }

  return { yesOutcome: homeOutcome, noOutcome: awayOutcome };
}

export function resolveLineOutcomePair(
  outcome: FixtureMarketOutcome,
  fixtureMarkets: Pick<
    GameFixtureMarketsSnapshot,
    "lines" | "esportsMarkets" | "esportsSections"
  >,
): LineOutcomePair | undefined {
  if (!isLineDualOutcomeMarket(outcome)) {
    return undefined;
  }

  const esportsPair = resolveEsportsOutcomePair(
    outcome,
    fixtureMarkets.esportsSections,
    fixtureMarkets.esportsMarkets,
  );

  if (esportsPair) {
    return esportsPair;
  }

  if (outcome.marketType === "team_to_advance") {
    return resolveTeamAdvanceOutcomePair(fixtureMarkets);
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
