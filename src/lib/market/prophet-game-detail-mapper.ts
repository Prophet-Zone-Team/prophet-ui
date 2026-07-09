import { mapEventSportsMarkets } from "@/lib/market/fixture-markets-mapper";
import { isEsportsGameSlug } from "@/lib/market/esports-game";
import {
  buildEsportsMarketSections,
  esportsMatchWinnerToMoneylineOutcomes,
  mapProphetEsportsMarkets,
} from "@/lib/market/map-prophet-esports-markets";
import { parseMatchOutcomeOdds } from "@/lib/market/match-outcome-odds";
import {
  isGammaEventRecord,
  type GammaEventRecord,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
import {
  buildFixtureMoneylineOutcomesFromProphetMarkets,
  mapProphetGameToMatch,
} from "@/lib/market/prophet-game-mapper";
import type {
  ProphetGameSiblingEventSlugs,
  ProphetPolyMarketEvent,
  ProphetPolyMarketGameDetail,
} from "@/types/prophet-api";
import type {
  PolymarketFixtureMoneylineOutcome,
  WorldCupMatch,
} from "@/types/market";

export function parseProphetGameEvents(
  events: ProphetPolyMarketGameDetail["events"],
): GammaEventRecord[] {
  if (!events?.length) {
    return [];
  }

  const parsed: GammaEventRecord[] = [];

  for (const entry of events) {
    const event = parseProphetGameEventEntry(entry);

    if (event) {
      parsed.push(event);
    }
  }

  return parsed;
}

function parseProphetGameEventEntry(
  entry: string | ProphetPolyMarketEvent,
): GammaEventRecord | undefined {
  if (typeof entry === "string") {
    try {
      const payload = JSON.parse(entry) as unknown;

      return isGammaEventRecord(payload) ? payload : undefined;
    } catch {
      return undefined;
    }
  }

  if (entry.slug || entry.markets?.length) {
    return {
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      markets: entry.markets as GammaMarketRecord[] | undefined,
    };
  }

  return undefined;
}

export function flattenProphetEventMarkets(
  events: ProphetPolyMarketGameDetail["events"],
): GammaMarketRecord[] {
  return parseProphetGameEvents(events).flatMap(
    (event) => event.markets ?? [],
  );
}

export function resolveProphetGameSiblingEventSlugs(
  detail: ProphetPolyMarketGameDetail,
): ProphetGameSiblingEventSlugs {
  const main = detail.slug?.trim() ?? "";

  if (!main) {
    return { main: "" };
  }

  const slugs = parseProphetGameEvents(detail.events)
    .map((event) => event.slug?.trim())
    .filter((slug): slug is string => Boolean(slug));

  return {
    main,
    moreMarkets: slugs.find((slug) => slug.endsWith("-more-markets")),
    halftime: slugs.find((slug) => slug.endsWith("-halftime-result")),
    exactScore: slugs.find((slug) => slug.endsWith("-exact-score")),
  };
}

export function buildDisplayMoneylineOutcomesFromMatch(
  match: WorldCupMatch,
): PolymarketFixtureMoneylineOutcome[] {
  const homeName = match.homeDisplayName ?? match.homeSeed ?? "Home";
  const awayName = match.awayDisplayName ?? match.awaySeed ?? "Away";
  const oddsResult = parseMatchOutcomeOdds(match, homeName, awayName);

  if (oddsResult.status !== "ready") {
    return [];
  }

  return [
    {
      side: "home",
      label: homeName,
      probability: Number((oddsResult.probabilities.home * 100).toFixed(1)),
    },
    {
      side: "draw",
      label: "Draw",
      probability: Number((oddsResult.probabilities.draw * 100).toFixed(1)),
    },
    {
      side: "away",
      label: awayName,
      probability: Number((oddsResult.probabilities.away * 100).toFixed(1)),
    },
  ];
}

export function mapProphetGameDetailToMatch(
  detail: ProphetPolyMarketGameDetail,
): WorldCupMatch | undefined {
  const match = mapProphetGameToMatch(detail);

  if (!match) {
    return undefined;
  }

  const homeName = match.homeDisplayName ?? match.homeSeed ?? "Home";
  const awayName = match.awayDisplayName ?? match.awaySeed ?? "Away";
  const fixtureSlug = detail.slug?.trim() ?? match.id;

  if (isEsportsGameSlug(fixtureSlug)) {
    const esportsMarkets = mapProphetEsportsMarkets(
      detail.markets,
      homeName,
      awayName,
      fixtureSlug,
    );
    const esportsSections = buildEsportsMarketSections(esportsMarkets);
    const moneylineOutcomes = esportsMatchWinnerToMoneylineOutcomes(esportsMarkets);
    const acceptingOrders =
      detail.markets?.some((market) => market.acceptingOrders === true) ??
      match.polymarket?.moneyline.acceptingOrders ??
      false;
    const closed = detail.closed === 1;

    if (!esportsMarkets.length) {
      return match;
    }

    return {
      ...match,
      polymarket: {
        ...match.polymarket!,
        closed,
        moneyline: {
          ...match.polymarket!.moneyline,
          acceptingOrders,
          conditionId:
            moneylineOutcomes[0]?.conditionId ??
            match.polymarket?.moneyline.conditionId,
          outcomes: moneylineOutcomes,
        },
        fixtureMarkets: {
          lines: [],
          exactScores: [],
          halftime: [],
          esportsMarkets,
          esportsSections,
        },
      },
    };
  }

  const tradingOutcomes = buildFixtureMoneylineOutcomesFromProphetMarkets(
    detail.markets,
    homeName,
    awayName,
    fixtureSlug,
  );
  const moneylineOutcomes =
    tradingOutcomes.length >= 3
      ? tradingOutcomes
      : buildDisplayMoneylineOutcomesFromMatch(match);
  const acceptingOrders =
    detail.markets?.some((market) => market.acceptingOrders === true) ??
    match.polymarket?.moneyline.acceptingOrders ??
    false;
  const closed = detail.closed === 1;
  const matchWithDisplayOutcomes =
    moneylineOutcomes.length > 0 && match.polymarket
      ? {
          ...match,
          polymarket: {
            ...match.polymarket,
            closed,
            moneyline: {
              ...match.polymarket.moneyline,
              acceptingOrders,
              conditionId:
                tradingOutcomes[0]?.conditionId ??
                match.polymarket.moneyline.conditionId,
              outcomes: moneylineOutcomes,
            },
          },
        }
      : match;
  const siblingMarkets = flattenProphetEventMarkets(detail.events);
  const fixtureMarkets = mapEventSportsMarkets(
    siblingMarkets,
    homeName,
    awayName,
    matchWithDisplayOutcomes.polymarket?.moneyline.outcomes ?? [],
    fixtureSlug,
  );

  if (
    !fixtureMarkets.lines.length &&
    !fixtureMarkets.exactScores.length &&
    !fixtureMarkets.halftime.length &&
    moneylineOutcomes.length === 0
  ) {
    return match;
  }

  return {
    ...matchWithDisplayOutcomes,
    polymarket: {
      ...matchWithDisplayOutcomes.polymarket!,
      fixtureMarkets,
    },
  };
}
