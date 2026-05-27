import {
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes,
} from "@/lib/market/build-fixture-markets-snapshot";
import { findFixtureGroupByType } from "@/views/trade/game/markets/fixture-market-actions";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
} from "@/types/market";

export function resolveFixtureOutcomesForTab(
  fixtureMarkets: GameFixtureMarketsSnapshot,
  tab: GameMarketTabId,
  lineKey?: string,
): FixtureMarketOutcome[] {
  switch (tab) {
    case "moneyline": {
      const group = findFixtureGroupByType(fixtureMarkets.lines, "moneyline");
      return sortFixtureGroupOutcomes(group?.outcomes ?? [], "moneyline");
    }
    case "halftime":
      return sortFixtureGroupOutcomes(fixtureMarkets.halftime, "halftime");
    case "totals": {
      const group = findFixtureGroupByType(fixtureMarkets.lines, "total");
      if (!group) {
        return [];
      }

      return sortFixtureGroupOutcomes(
        getFixtureOutcomesForGroup(group, lineKey ?? group.defaultLineKey),
        "total",
      );
    }
    case "spreads": {
      const group = findFixtureGroupByType(fixtureMarkets.lines, "spread");
      if (!group) {
        return [];
      }

      return sortFixtureGroupOutcomes(
        getFixtureOutcomesForGroup(group, lineKey ?? group.defaultLineKey),
        "spread",
      );
    }
    case "top_scores":
      return fixtureMarkets.exactScores;
    default:
      return [];
  }
}
