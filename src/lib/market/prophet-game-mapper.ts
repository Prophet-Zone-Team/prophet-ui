import { findCuratedTeamByCode } from "@/data/teams/curated-team-list";
import {
  extractEsportsLeagueFromTitle,
  isEsportsGameSlug,
} from "@/lib/market/esports-game";
import {
  normalizeGammaSearchText,
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber
} from "@/lib/market/polymarket-gamma";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import type {
  ProphetPolyMarketGameItem,
  ProphetPolyMarketMarket
} from "@/types/prophet-api";
import type {
  MatchOddsOutcome,
  MatchOutcomeSide,
  PolymarketFixtureMoneylineOutcome,
  WorldCupMatch,
  WorldCupMatchStatus
} from "@/types/market";

export function mapProphetGamesToMatches(
  games: ProphetPolyMarketGameItem[]
): WorldCupMatch[] {
  const matches: WorldCupMatch[] = [];

  for (const game of games) {
    const match = mapProphetGameToMatch(game);

    if (match) {
      matches.push(match);
    }
  }

  return matches;
}

export function mapProphetGameToMatch(
  game: ProphetPolyMarketGameItem | null | undefined
): WorldCupMatch | undefined {
  if (!game) {
    return undefined;
  }

  const slug = game.slug?.trim();

  if (!slug) {
    return undefined;
  }

  const sides = resolveProphetFixtureSides(game);
  const homeName = sides.homeName;
  const awayName = sides.awayName;

  if (!homeName || !awayName) {
    return undefined;
  }

  const isEsports = isEsportsGameSlug(slug);
  const homeTeam = isEsports
    ? undefined
    : resolveWorldCupTeamByGroupItemTitle(homeName);
  const awayTeam = isEsports
    ? undefined
    : resolveWorldCupTeamByGroupItemTitle(awayName);
  const eventId = game.gameId ? String(game.gameId) : slug;
  const lastUpdated = game.start_time ?? new Date().toISOString();
  const volume = parseProphetVolume(game.volume);
  const fixtureAbbrevs = extractFixtureTeamAbbreviations(slug);
  const oddsOutcomes = buildOddsFromProphetMarkets(
    game.markets,
    homeName,
    awayName,
    lastUpdated,
    fixtureAbbrevs
  );
  const moneylineOutcomes = buildFixtureMoneylineOutcomesFromProphetMarkets(
    game.markets,
    homeName,
    awayName,
    slug
  );
  const acceptingOrders =
    Boolean(game.markets?.some((market) => market.acceptingOrders === true)) ||
    game.active === 1;

  return {
    id: slug,
    matchId: hashFixtureId(eventId),
    eventId: eventId,
    stage: "EXTERNAL",
    homeTeamId: homeTeam?.id,
    awayTeamId: awayTeam?.id,
    homeDisplayName: homeName,
    awayDisplayName: awayName,
    homeApiTeamId: sides.homeApiTeamId,
    awayApiTeamId: sides.awayApiTeamId,
    homePolymarketTeamId: sides.homePolymarketTeamId,
    awayPolymarketTeamId: sides.awayPolymarketTeamId,
    homeLogoUrl: sides.homeLogoUrl,
    awayLogoUrl: sides.awayLogoUrl,
    homeSeed: homeTeam ? undefined : homeName,
    awaySeed: awayTeam ? undefined : awayName,
    status: mapProphetGameStatus(game),
    kickoffAt: game.start_time,
    homeScore: game.home_score,
    awayScore: game.away_score,
    league: isEsports
      ? extractEsportsLeagueFromTitle(game.title ?? "") ?? "Esports"
      : "FIFA World Cup",
    odds:
      oddsOutcomes.length >= 3
        ? {
            source: "polymarket",
            status: "live",
            outcomes: oddsOutcomes,
            lastUpdated
          }
        : undefined,
    freshness: {
      source: "prophet-api",
      status: "live",
      lastUpdated
    },
    polymarket: {
      eventId,
      slug,
      volume,
      closed: game.closed === 1,
      moneyline: {
        acceptingOrders,
        conditionId: moneylineOutcomes[0]?.conditionId,
        outcomes: moneylineOutcomes
      }
    }
  };
}

function resolveProphetFixtureSides(game: ProphetPolyMarketGameItem): {
  homeName?: string;
  awayName?: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  homeApiTeamId?: number;
  awayApiTeamId?: number;
  homePolymarketTeamId?: number;
  awayPolymarketTeamId?: number;
} {
  const teams = game.teams ?? [];
  const homeByOrdering = teams.find((team) => team.ordering === "home");
  const awayByOrdering = teams.find((team) => team.ordering === "away");
  const homeTeam = homeByOrdering ?? teams[0];
  const awayTeam = awayByOrdering ?? teams[1];
  const homeName = homeTeam?.name?.trim();
  const awayName = awayTeam?.name?.trim();

  if (homeName && awayName) {
    return {
      homeName,
      awayName,
      homeLogoUrl: homeTeam?.logo?.trim() || undefined,
      awayLogoUrl: awayTeam?.logo?.trim() || undefined,
      homeApiTeamId: homeTeam?.api_team_id,
      awayApiTeamId: awayTeam?.api_team_id,
      homePolymarketTeamId: homeTeam?.polymarket_team_id,
      awayPolymarketTeamId: awayTeam?.polymarket_team_id
    };
  }

  return parseTeamsFromTitle(game.title ?? "");
}

export function parseTeamsFromTitle(title: string): {
  homeName?: string;
  awayName?: string;
} {
  const parts = title.split(/\s+vs\.?\s+|\s+v\s+/i);

  if (parts.length !== 2) {
    return {};
  }

  return {
    homeName: parts[0]?.trim(),
    awayName: parts[1]?.trim()
  };
}

export function mapProphetGameStatus(
  game: ProphetPolyMarketGameItem
): WorldCupMatchStatus {
  if (game.closed === 1 || game.status === 2) {
    return "finished";
  }

  if (game.active === 0) {
    return "cancelled";
  }

  // Reserved for backend live status codes.
  if (game.status === 1) {
    return "live";
  }

  return "scheduled";
}

export function extractFixtureTeamAbbreviations(fixtureSlug: string): {
  homeAbbrev?: string;
  awayAbbrev?: string;
} {
  const match = fixtureSlug.match(
    /^[a-z0-9]+-([^-]+)-([^-]+)-\d{4}-\d{2}-\d{2}$/i
  );

  if (!match) {
    return {};
  }

  return {
    homeAbbrev: match[1]?.trim().toLowerCase(),
    awayAbbrev: match[2]?.trim().toLowerCase()
  };
}

export function buildFixtureMoneylineOutcomesFromProphetMarkets(
  markets: ProphetPolyMarketMarket[] | null | undefined,
  homeName: string,
  awayName: string,
  fixtureSlug: string
): PolymarketFixtureMoneylineOutcome[] {
  if (!markets?.length) {
    return [];
  }

  const fixtureAbbrevs = extractFixtureTeamAbbreviations(fixtureSlug);
  const outcomes: PolymarketFixtureMoneylineOutcome[] = [];

  for (const market of markets) {
    const side = resolveProphetMarketOutcomeSide(
      market,
      homeName,
      awayName,
      fixtureAbbrevs
    );

    if (!side) {
      continue;
    }

    const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
    const prices = parseGammaArrayField(market.outcomePrices);
    const probability = priceToProbability(toGammaNumber(prices[0]));

    if (probability === undefined) {
      continue;
    }

    outcomes.push({
      side,
      label: side === "draw" ? "Draw" : side === "home" ? homeName : awayName,
      tokenId: tokenIds[0] || undefined,
      noTokenId: tokenIds[1] || undefined,
      conditionId: market.conditionId,
      probability,
      volume:
        parseProphetVolume(
          market.volume === undefined ? undefined : String(market.volume)
        ) || undefined
    });
  }

  const sideOrder: Record<MatchOutcomeSide, number> = {
    home: 0,
    draw: 1,
    away: 2
  };

  return outcomes.sort(
    (left, right) => sideOrder[left.side] - sideOrder[right.side]
  );
}

function resolveProphetMarketOutcomeSide(
  market: ProphetPolyMarketMarket,
  homeName: string,
  awayName: string,
  fixtureAbbrevs: ReturnType<typeof extractFixtureTeamAbbreviations>
): MatchOutcomeSide | undefined {
  const slug = market.slug?.trim();
  const suffix = slug ? extractMarketSlugSuffix(slug) : undefined;

  if (suffix === "draw") {
    return "draw";
  }

  if (fixtureAbbrevs.homeAbbrev && suffix === fixtureAbbrevs.homeAbbrev) {
    return "home";
  }

  if (fixtureAbbrevs.awayAbbrev && suffix === fixtureAbbrevs.awayAbbrev) {
    return "away";
  }

  const label = resolveProphetMarketOutcomeLabel(
    market,
    homeName,
    awayName,
    fixtureAbbrevs
  );

  if (!label || label === "Draw") {
    return label === "Draw" ? "draw" : undefined;
  }

  if (label === homeName) {
    return "home";
  }

  if (label === awayName) {
    return "away";
  }

  return undefined;
}

function buildOddsFromProphetMarkets(
  markets: ProphetPolyMarketMarket[] | null | undefined,
  homeName: string,
  awayName: string,
  lastUpdated: string,
  fixtureAbbrevs: ReturnType<typeof extractFixtureTeamAbbreviations>
): MatchOddsOutcome[] {
  if (!markets?.length) {
    return [];
  }

  const outcomes: MatchOddsOutcome[] = [];

  for (const market of markets) {
    const yesPrice = parseProphetMarketYesPrice(market);

    if (yesPrice !== undefined) {
      const label = resolveProphetMarketOutcomeLabel(
        market,
        homeName,
        awayName,
        fixtureAbbrevs
      );

      if (!label) {
        continue;
      }

      outcomes.push({
        label,
        impliedProbability: yesPrice,
        lastUpdated
      });
      continue;
    }

    const labels = parseProphetMarketOutcomeLabels(market);
    const prices = market.prices ?? [];

    for (let index = 0; index < labels.length; index += 1) {
      const label = labels[index]?.trim();

      if (!label) {
        continue;
      }

      const price = Number(prices[index]);

      if (!Number.isFinite(price) || price < 0) {
        continue;
      }

      outcomes.push({
        label: normalizeOutcomeLabel(label, homeName, awayName),
        impliedProbability: price,
        lastUpdated
      });
    }
  }

  return outcomes;
}

function parseProphetMarketYesPrice(
  market: ProphetPolyMarketMarket
): number | undefined {
  if (!market.outcomePrices) {
    return undefined;
  }

  const prices = parseGammaArrayField(market.outcomePrices);
  const price = toGammaNumber(prices[0]);

  if (price === undefined || !Number.isFinite(price) || price < 0) {
    return undefined;
  }

  return price;
}

function parseProphetMarketOutcomeLabels(
  market: ProphetPolyMarketMarket
): string[] {
  return parseGammaArrayField(market.outcomes).map(String);
}

function resolveProphetMarketOutcomeLabel(
  market: ProphetPolyMarketMarket,
  homeName: string,
  awayName: string,
  fixtureAbbrevs: ReturnType<typeof extractFixtureTeamAbbreviations>
): string | undefined {
  const groupTitle = market.groupItemTitle?.trim();

  if (groupTitle) {
    return normalizeOutcomeLabel(groupTitle, homeName, awayName);
  }

  const slug = market.slug?.trim();

  if (!slug) {
    return undefined;
  }

  const suffix = extractMarketSlugSuffix(slug);

  if (!suffix) {
    return undefined;
  }

  if (suffix === "draw") {
    return "Draw";
  }

  if (fixtureAbbrevs.homeAbbrev && suffix === fixtureAbbrevs.homeAbbrev) {
    return homeName;
  }

  if (fixtureAbbrevs.awayAbbrev && suffix === fixtureAbbrevs.awayAbbrev) {
    return awayName;
  }

  const team = findCuratedTeamByCode(suffix);

  if (team) {
    return normalizeOutcomeLabel(team.name, homeName, awayName);
  }

  return undefined;
}

function extractMarketSlugSuffix(slug: string): string | undefined {
  const match = slug.match(/(\d{4}-\d{2}-\d{2})-(.+)$/);

  return match?.[2]?.trim().toLowerCase();
}

function normalizeOutcomeLabel(
  label: string,
  homeName: string,
  awayName: string
): string {
  const normalized = normalizeGammaSearchText(label);

  if (
    ["draw", "tie", "x", "d"].includes(normalized) ||
    normalized.includes("draw")
  ) {
    return "Draw";
  }

  const home = normalizeGammaSearchText(homeName);
  const away = normalizeGammaSearchText(awayName);

  if (
    normalized === home ||
    normalized.includes(home) ||
    home.includes(normalized)
  ) {
    return homeName;
  }

  if (
    normalized === away ||
    normalized.includes(away) ||
    away.includes(normalized)
  ) {
    return awayName;
  }

  return label;
}

function parseProphetVolume(volume: string | undefined): number {
  if (!volume) {
    return 0;
  }

  const parsed = Number(volume);

  return Number.isFinite(parsed) ? parsed : 0;
}

function hashFixtureId(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % 1_000_000 || 1;
}
