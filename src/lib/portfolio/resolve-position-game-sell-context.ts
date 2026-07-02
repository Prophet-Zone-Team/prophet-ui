import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketOutcome,
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  UserPositionRecord
} from "@/types/market";

import { resolveOutcomeSideForGamePosition } from "@/lib/portfolio/portfolio-metrics";

export interface PositionGameSellContext {
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  matchOutcomeSide: MatchOutcomeSide;
  fixtureOutcome: FixtureMarketOutcome | null;
  outcomeSide: OrderOutcomeSide;
}

interface OutcomeTokenMatch {
  tokenId?: string;
  noTokenId?: string;
  conditionId?: string;
}

function matchesPositionTokens(
  position: UserPositionRecord,
  candidate: OutcomeTokenMatch
): boolean {
  if (
    position.asset &&
    (candidate.tokenId === position.asset ||
      candidate.noTokenId === position.asset)
  ) {
    return true;
  }

  if (
    position.conditionId &&
    candidate.conditionId &&
    candidate.conditionId === position.conditionId
  ) {
    return true;
  }

  return false;
}

function findMoneylineOutcomeForPosition(
  position: UserPositionRecord,
  gameSnapshot: GameMarketSnapshot
): GameMarketOutcome | undefined {
  return gameSnapshot.outcomes.find((outcome) =>
    matchesPositionTokens(position, outcome)
  );
}

function collectFixtureOutcomes(
  fixtureMarkets: GameFixtureMarketsSnapshot
): FixtureMarketOutcome[] {
  const results: FixtureMarketOutcome[] = [];

  for (const group of fixtureMarkets.lines) {
    results.push(...group.outcomes);

    if (group.outcomesByLine) {
      for (const outcomes of Object.values(group.outcomesByLine)) {
        results.push(...outcomes);
      }
    }
  }

  results.push(...fixtureMarkets.exactScores);
  results.push(...fixtureMarkets.halftime);

  return results;
}

function findFixtureOutcomeForPosition(
  position: UserPositionRecord,
  fixtureMarkets: GameFixtureMarketsSnapshot
): FixtureMarketOutcome | undefined {
  const outcomes = collectFixtureOutcomes(fixtureMarkets);

  const byAsset = outcomes.find(
    (outcome) =>
      outcome.tokenId === position.asset ||
      outcome.noTokenId === position.asset,
  );

  if (byAsset) {
    return byAsset;
  }

  return outcomes.find((outcome) =>
    matchesPositionTokens(position, outcome),
  );
}

function resolveMatchOutcomeSideFromFixture(
  outcome: FixtureMarketOutcome,
  fallback: MatchOutcomeSide
): MatchOutcomeSide {
  if (
    outcome.side === "home" ||
    outcome.side === "draw" ||
    outcome.side === "away"
  ) {
    return outcome.side;
  }

  return fallback;
}

export function resolvePositionGameSellContext(
  position: UserPositionRecord,
  gameSnapshot: GameMarketSnapshot,
  fixtureMarkets: GameFixtureMarketsSnapshot
): PositionGameSellContext | undefined {
  const moneylineOutcome = findMoneylineOutcomeForPosition(
    position,
    gameSnapshot
  );

  if (moneylineOutcome) {
    return {
      gameSnapshot,
      fixtureMarkets,
      matchOutcomeSide: moneylineOutcome.side,
      fixtureOutcome: null,
      outcomeSide: resolveOutcomeSideForGamePosition(position, {
        yesTokenId: moneylineOutcome.tokenId,
        noTokenId: moneylineOutcome.noTokenId
      })
    };
  }

  const fixtureOutcome = findFixtureOutcomeForPosition(position, fixtureMarkets);

  if (!fixtureOutcome) {
    return undefined;
  }

  return {
    gameSnapshot,
    fixtureMarkets,
    matchOutcomeSide: resolveMatchOutcomeSideFromFixture(
      fixtureOutcome,
      gameSnapshot.outcomes[0]?.side ?? "home"
    ),
    fixtureOutcome,
    outcomeSide: resolveOutcomeSideForGamePosition(position, {
      yesTokenId: fixtureOutcome.tokenId,
      noTokenId: fixtureOutcome.noTokenId,
      yesOutcome: fixtureOutcome.label,
    }),
  };
}
