import { findFixtureMarketOutcome } from "@/lib/market/fixture-markets-mapper";
import type {
  FixtureMarketOutcome,
  MatchOutcomeSide,
  WorldCupMatch
} from "@/types/market";
import type { MarketOddsOption } from "@/views/markets/content/market-item/types";

export interface MarketOddsSelection {
  fixtureOutcome?: FixtureMarketOutcome;
  matchOutcomeSide?: MatchOutcomeSide;
}

function findFixtureOutcomeInMatch(
  match: WorldCupMatch,
  outcomeId: string
): FixtureMarketOutcome | undefined {
  const snapshot = match.polymarket?.fixtureMarkets;

  if (!snapshot) {
    return undefined;
  }

  const direct = findFixtureMarketOutcome(snapshot, outcomeId);

  if (direct) {
    return direct;
  }

  for (const group of snapshot.lines) {
    if (!group.outcomesByLine) {
      continue;
    }

    for (const outcomes of Object.values(group.outcomesByLine)) {
      const nested = outcomes.find((item) => item.id === outcomeId);

      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function resolveMoneylineSideFromIndex(index: number): MatchOutcomeSide | undefined {
  const sides: MatchOutcomeSide[] = ["home", "draw", "away"];

  return sides[index];
}

export function resolveMarketOddsSelection(
  match: WorldCupMatch,
  option: MarketOddsOption
): MarketOddsSelection {
  const parts = option.id.split(":");

  if (parts.length < 3 || parts[0] !== match.id) {
    return {};
  }

  const prefix = parts[1];
  const suffix = parts.slice(2).join(":");

  if (prefix === "spread" || prefix === "total" || prefix === "score" || prefix === "ml") {
    const fixtureOutcome = findFixtureOutcomeInMatch(match, suffix);

    if (fixtureOutcome) {
      return { fixtureOutcome };
    }
  }

  if (prefix === "ml") {
    const index = Number(suffix);

    if (!Number.isNaN(index)) {
      const matchOutcomeSide = resolveMoneylineSideFromIndex(index);

      if (matchOutcomeSide) {
        return { matchOutcomeSide };
      }
    }
  }

  return {};
}
