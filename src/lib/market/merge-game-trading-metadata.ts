import { mapEventSportsMarkets } from "@/lib/market/fixture-markets-mapper";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import { buildFixtureMoneylineOutcomesFromGammaMarkets } from "@/lib/market/polymarket-football-match-mapper";
import type { GammaEventRecord, GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import type {
  PolymarketFixtureMarketsData,
  WorldCupMatch,
} from "@/types/market";

function resolveMatchSideNames(match: WorldCupMatch): {
  homeName: string;
  awayName: string;
} {
  return {
    homeName: match.homeDisplayName ?? match.homeSeed ?? "Home",
    awayName: match.awayDisplayName ?? match.awaySeed ?? "Away",
  };
}

export function mergeMoneylineFromGammaEvent(
  match: WorldCupMatch,
  event: GammaEventRecord,
): WorldCupMatch {
  if (!match.polymarket) {
    return match;
  }

  const { homeName, awayName } = resolveMatchSideNames(match);
  const outcomes = buildFixtureMoneylineOutcomesFromGammaMarkets(
    event.markets ?? [],
    homeName,
    awayName,
  );

  if (outcomes.length < 3) {
    return match;
  }

  return syncFixtureMoneylineGroup({
    ...match,
    polymarket: {
      ...match.polymarket,
      closed: event.closed === true || match.polymarket.closed === true,
      moneyline: {
        ...match.polymarket.moneyline,
        conditionId: outcomes[0]?.conditionId ?? match.polymarket.moneyline.conditionId,
        acceptingOrders:
          (event.markets ?? []).some((market) => market.acceptingOrders === true) ||
          match.polymarket.moneyline.acceptingOrders,
        outcomes,
      },
    },
  });
}

export function syncFixtureMoneylineGroup(match: WorldCupMatch): WorldCupMatch {
  if (!match.polymarket) {
    return match;
  }

  const outcomes = match.polymarket.moneyline.outcomes;

  if (!outcomes.length) {
    return match;
  }

  const { homeName, awayName } = resolveMatchSideNames(match);
  const moneylineFixture = mapEventSportsMarkets([], homeName, awayName, outcomes);
  const existing = match.polymarket.fixtureMarkets ?? {
    lines: [],
    exactScores: [],
    halftime: [],
  };
  const otherLines = existing.lines.filter((group) => group.type !== "moneyline");

  return {
    ...match,
    polymarket: {
      ...match.polymarket,
      fixtureMarkets: {
        ...existing,
        lines: [...moneylineFixture.lines, ...otherLines],
      },
    },
  };
}

function mergeFixtureMarketGroups(
  existing: PolymarketFixtureMarketsData,
  incoming: PolymarketFixtureMarketsData,
  tab: GameMarketTabId,
): PolymarketFixtureMarketsData {
  if (tab === "totals" || tab === "spreads") {
    const preservedLines = existing.lines.filter(
      (group) => group.type !== "spread" && group.type !== "total",
    );
    const refreshedLines = incoming.lines.filter(
      (group) => group.type === "spread" || group.type === "total",
    );

    return {
      ...existing,
      lines: [...preservedLines, ...refreshedLines],
    };
  }

  if (tab === "halftime") {
    return {
      ...existing,
      halftime: incoming.halftime,
    };
  }

  if (tab === "top_scores") {
    return {
      ...existing,
      exactScores: incoming.exactScores,
    };
  }

  return existing;
}

export function mergeFixtureMarketsFromGammaEvent(
  match: WorldCupMatch,
  event: GammaEventRecord,
  tab: GameMarketTabId,
): WorldCupMatch {
  if (!match.polymarket) {
    return match;
  }

  const { homeName, awayName } = resolveMatchSideNames(match);
  const incoming = mapEventSportsMarkets(
    event.markets ?? [],
    homeName,
    awayName,
    match.polymarket.moneyline.outcomes,
    match.polymarket.slug ?? match.id,
  );
  const existing = match.polymarket.fixtureMarkets ?? {
    lines: [],
    exactScores: [],
    halftime: [],
  };

  return {
    ...match,
    polymarket: {
      ...match.polymarket,
      closed: event.closed === true || match.polymarket.closed === true,
      fixtureMarkets: mergeFixtureMarketGroups(existing, incoming, tab),
    },
  };
}

export function resolveSiblingEventSlugForTab(
  tab: GameMarketTabId,
  slugs: {
    main: string;
    moreMarkets?: string;
    halftime?: string;
    exactScore?: string;
  },
): string | undefined {
  if (tab === "moneyline") {
    return slugs.main;
  }

  if (tab === "totals" || tab === "spreads") {
    return slugs.moreMarkets;
  }

  if (tab === "halftime") {
    return slugs.halftime;
  }

  if (tab === "top_scores") {
    return slugs.exactScore;
  }

  return undefined;
}

export function gammaEventUrl(slug: string): string {
  return `https://gamma-api.polymarket.com/events/slug/${encodeURIComponent(slug)}`;
}

export function isGammaEventPayload(value: unknown): value is GammaEventRecord {
  return Boolean(value && typeof value === "object" && "slug" in value);
}

export function extractMarketsFromGammaEvent(
  event: GammaEventRecord,
): GammaMarketRecord[] {
  return event.markets ?? [];
}
