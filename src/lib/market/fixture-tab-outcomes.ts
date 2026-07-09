import {
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes,
} from "@/lib/market/build-fixture-markets-snapshot";
import { findFixtureGroupByType } from "@/views/trade/game/markets/fixture-market-actions";
import { collectEsportsFixtureOutcomes } from "@/lib/market/map-prophet-esports-markets";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import type {
  FixtureMarketGroup,
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
} from "@/types/market";

function collectEsportsFixtureOutcomesFromSnapshot(
  fixtureMarkets: GameFixtureMarketsSnapshot,
): FixtureMarketOutcome[] {
  return collectEsportsFixtureOutcomes(
    fixtureMarkets.esportsSections,
    fixtureMarkets.esportsMarkets,
  );
}

function collectAllOutcomesForLineGroup(
  group: FixtureMarketGroup,
): FixtureMarketOutcome[] {
  if (group.outcomesByLine) {
    return Object.values(group.outcomesByLine).flat();
  }

  return group.outcomes;
}

function addUniqueOutcomes(
  target: Map<string, FixtureMarketOutcome>,
  outcomes: FixtureMarketOutcome[],
): void {
  for (const outcome of outcomes) {
    if (!target.has(outcome.id)) {
      target.set(outcome.id, outcome);
    }
  }
}

/** All fixture outcomes across moneyline, totals, spreads, halftime, and top scores. */
export function resolveAllFixtureOutcomes(
  fixtureMarkets: GameFixtureMarketsSnapshot,
): FixtureMarketOutcome[] {
  const byId = new Map<string, FixtureMarketOutcome>();

  addUniqueOutcomes(
    byId,
    resolveFixtureOutcomesForTab(fixtureMarkets, "moneyline"),
  );
  addUniqueOutcomes(byId, fixtureMarkets.halftime);
  addUniqueOutcomes(byId, fixtureMarkets.exactScores);

  const totalGroup = findFixtureGroupByType(fixtureMarkets.lines, "total");

  if (totalGroup) {
    addUniqueOutcomes(byId, collectAllOutcomesForLineGroup(totalGroup));
  }

  const spreadGroup = findFixtureGroupByType(fixtureMarkets.lines, "spread");

  if (spreadGroup) {
    addUniqueOutcomes(byId, collectAllOutcomesForLineGroup(spreadGroup));
  }

  if (fixtureMarkets.esportsSections?.length) {
    addUniqueOutcomes(
      byId,
      collectEsportsFixtureOutcomesFromSnapshot(fixtureMarkets),
    );
  } else if (fixtureMarkets.esportsMarkets?.length) {
    addUniqueOutcomes(
      byId,
      fixtureMarkets.esportsMarkets.flatMap((card) => card.outcomes),
    );
  }

  return [...byId.values()];
}

export function resolveFixtureOutcomesForTab(
  fixtureMarkets: GameFixtureMarketsSnapshot,
  tab: GameMarketTabId,
  lineKey?: string,
): FixtureMarketOutcome[] {
  switch (tab) {
    case "moneyline": {
      const outcomes: FixtureMarketOutcome[] = [];
      const moneylineGroup = findFixtureGroupByType(fixtureMarkets.lines, "moneyline");
      const teamToAdvanceGroup = findFixtureGroupByType(
        fixtureMarkets.lines,
        "team_to_advance",
      );
      const extraTimeGroup = findFixtureGroupByType(fixtureMarkets.lines, "extra_time");
      const penaltyGroup = findFixtureGroupByType(
        fixtureMarkets.lines,
        "penalty_shootout",
      );

      if (moneylineGroup) {
        outcomes.push(...sortFixtureGroupOutcomes(moneylineGroup.outcomes, "moneyline"));
      }
      if (teamToAdvanceGroup) {
        outcomes.push(...teamToAdvanceGroup.outcomes);
      }
      if (extraTimeGroup) {
        outcomes.push(...extraTimeGroup.outcomes);
      }
      if (penaltyGroup) {
        outcomes.push(...penaltyGroup.outcomes);
      }

      return outcomes;
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
