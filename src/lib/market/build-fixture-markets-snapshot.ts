import type {
  FixtureLineOption,
  FixtureMarketGroup,
  FixtureSportsMarketType,
  GameFixtureMarketsSnapshot,
  PolymarketFixtureMarketsData,
  WorldCupMatch,
} from "@/types/market";

export function buildFixtureMarketsSnapshot(
  match: WorldCupMatch,
): GameFixtureMarketsSnapshot {
  const fixtureMarkets = match.polymarket?.fixtureMarkets;

  return {
    matchId: match.id,
    lines: fixtureMarkets?.lines ?? [],
    exactScores: fixtureMarkets?.exactScores ?? [],
    halftime: fixtureMarkets?.halftime ?? [],
    freshness: match.freshness,
  };
}

export function hasFixtureMarkets(snapshot: GameFixtureMarketsSnapshot): boolean {
  return (
    snapshot.lines.length > 0 ||
    snapshot.exactScores.length > 0 ||
    snapshot.halftime.length > 0
  );
}

export function getFixtureLineOptions(
  group: PolymarketFixtureMarketsData["lines"][number],
): FixtureLineOption[] {
  if (group.lineOptionKeys?.length) {
    return group.lineOptionKeys;
  }

  return (group.lineOptions ?? []).map((label) => ({
    key: String(label),
    label,
  }));
}

export function getFixtureOutcomesForGroup(
  group: PolymarketFixtureMarketsData["lines"][number],
  selectedLineKey?: string,
): PolymarketFixtureMarketsData["lines"][number]["outcomes"] {
  const lineKey =
    selectedLineKey ??
    group.defaultLineKey ??
    (group.defaultLine !== undefined ? String(group.defaultLine) : undefined);

  if (lineKey && group.outcomesByLine?.[lineKey]?.length) {
    return sortFixtureGroupOutcomes(group.outcomesByLine[lineKey]!, group.type);
  }

  return sortFixtureGroupOutcomes(group.outcomes, group.type);
}

const moneylineOrder = ["home", "draw", "away"] as const;
const spreadOrder = ["home", "away"] as const;
const totalOrder = ["over", "under"] as const;

function getOutcomeSortOrder(
  type: FixtureSportsMarketType,
): readonly string[] | null {
  if (type === "moneyline" || type === "halftime") {
    return moneylineOrder;
  }

  if (type === "team_to_advance") {
    return spreadOrder;
  }

  if (type === "spread") {
    return spreadOrder;
  }

  if (type === "total") {
    return totalOrder;
  }

  return null;
}

export function sortFixtureGroupOutcomes(
  outcomes: FixtureMarketGroup["outcomes"],
  type: FixtureSportsMarketType,
): FixtureMarketGroup["outcomes"] {
  const order = getOutcomeSortOrder(type);

  if (!order) {
    return outcomes;
  }

  return [...outcomes].sort((left, right) => {
    const leftIndex = left.side ? order.indexOf(left.side as string) : 99;
    const rightIndex = right.side ? order.indexOf(right.side as string) : 99;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.label.localeCompare(right.label);
  });
}
