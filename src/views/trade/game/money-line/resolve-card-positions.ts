import type { FixtureMarketOutcome, UserPositionRecord } from "@/types/market";

import type { MoneyLineCardDefinition } from "./types";

function collectCardMarketKeys(card: MoneyLineCardDefinition): {
  conditionIds: Set<string>;
  tokenIds: Set<string>;
} {
  const conditionIds = new Set<string>();
  const tokenIds = new Set<string>();

  for (const outcome of card.group.outcomes) {
    if (outcome.conditionId) {
      conditionIds.add(outcome.conditionId);
    }

    if (outcome.tokenId) {
      tokenIds.add(outcome.tokenId);
    }

    if (outcome.noTokenId) {
      tokenIds.add(outcome.noTokenId);
    }
  }

  return { conditionIds, tokenIds };
}

export function collectMoneyLineConditionIds(
  cards: MoneyLineCardDefinition[]
): string[] {
  const ids = new Set<string>();

  for (const card of cards) {
    for (const outcome of card.group.outcomes) {
      if (outcome.conditionId) {
        ids.add(outcome.conditionId);
      }
    }
  }

  return [...ids];
}

export function resolvePositionsForCard(
  card: MoneyLineCardDefinition,
  positions: UserPositionRecord[]
): UserPositionRecord[] {
  const { conditionIds, tokenIds } = collectCardMarketKeys(card);

  return positions.filter((position) => {
    if (position.size <= 0) {
      return false;
    }

    if (conditionIds.has(position.conditionId)) {
      return true;
    }

    return tokenIds.has(position.asset);
  });
}

export function resolveFixtureOutcomeForPosition(
  position: UserPositionRecord,
  outcomes: FixtureMarketOutcome[]
): FixtureMarketOutcome | undefined {
  return outcomes.find(
    (outcome) =>
      outcome.tokenId === position.asset ||
      outcome.noTokenId === position.asset ||
      (outcome.conditionId && outcome.conditionId === position.conditionId)
  );
}

export function sumPositionCurrentValue(
  positions: UserPositionRecord[]
): number {
  return positions.reduce((sum, position) => sum + position.currentValue, 0);
}
