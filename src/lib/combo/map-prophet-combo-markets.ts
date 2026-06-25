import { flattenProphetEventMarkets } from "@/lib/market/prophet-game-detail-mapper";
import {
  extractFixtureTeamAbbreviations,
  mapProphetGameStatus,
  parseTeamsFromTitle,
} from "@/lib/market/prophet-game-mapper";
import { parseGammaArrayField } from "@/lib/market/polymarket-gamma";
import { findCuratedTeamByCode } from "@/data/teams/curated-team-list";
import type {
  ComboGameGroup,
  ComboGameTeam,
  ComboMarketRecord,
} from "@/types/combo";
import type {
  ProphetGetComboMarketsData,
  ProphetPolyMarketComboGame,
  ProphetPolyMarketMarket,
} from "@/types/prophet-api";

export interface MappedComboMarketsResult {
  groups: ComboGameGroup[];
  markets: ComboMarketRecord[];
}

export function mapProphetComboMarketsResponse(
  data: ProphetGetComboMarketsData | null | undefined,
): MappedComboMarketsResult {
  const groups: ComboGameGroup[] = [];
  const markets: ComboMarketRecord[] = [];

  for (const game of data?.list ?? []) {
    const group = mapProphetComboGame(game);

    if (!group || group.markets.length === 0) {
      continue;
    }

    groups.push(group);
    markets.push(...group.markets);
  }

  return { groups, markets };
}

function mapProphetComboGame(
  game: ProphetPolyMarketComboGame,
): ComboGameGroup | undefined {
  const slug = game.slug?.trim();

  if (!slug) {
    return undefined;
  }

  const comboSlugs = new Set(
    (game.combo_markets ?? [])
      .map((entry) => entry.trim())
      .filter((entry): entry is string => Boolean(entry)),
  );
  const mappedMarkets = collectComboGameSourceMarkets(game)
    .map((market) =>
      mapProphetMarketToComboRecord(market, {
        image: game.image?.trim() || game.icon?.trim() || undefined,
        comboSlugs,
      }),
    )
    .filter((market): market is ComboMarketRecord => Boolean(market));

  if (mappedMarkets.length === 0) {
    return undefined;
  }

  const { homeTeam, awayTeam } = resolveComboGameTeams(game, slug);

  return {
    slug,
    title: game.title?.trim() || slug,
    kickoffAt: game.start_time?.trim() || undefined,
    kickoffLabel: formatKickoffLabel(game.start_time),
    image: game.image?.trim() || game.icon?.trim() || undefined,
    homeTeam,
    awayTeam,
    markets: mappedMarkets,
    status: mapProphetGameStatus(game),
    eventId: game.gameId ? String(game.gameId) : undefined,
    homeScore: game.home_score,
    awayScore: game.away_score,
  };
}

function collectComboGameSourceMarkets(
  game: ProphetPolyMarketComboGame,
): ProphetPolyMarketMarket[] {
  const bySlug = new Map<string, ProphetPolyMarketMarket>();

  for (const market of game.markets ?? []) {
    const slug = market.slug?.trim();

    if (slug) {
      bySlug.set(slug, market);
    }
  }

  for (const market of flattenProphetEventMarkets(game.events)) {
    const slug = market.slug?.trim();

    if (!slug || bySlug.has(slug)) {
      continue;
    }

    bySlug.set(slug, market as ProphetPolyMarketMarket);
  }

  return [...bySlug.values()];
}

export function mapProphetMarketToComboRecord(
  market: ProphetPolyMarketMarket,
  context: {
    image?: string;
    comboSlugs: Set<string>;
  },
): ComboMarketRecord | undefined {
  const slug = market.slug?.trim();
  const conditionId = market.conditionId?.trim();
  const positionIds = resolveComboMarketPositionIds(market);

  if (
    !slug ||
    !conditionId ||
    !positionIds ||
    !context.comboSlugs.has(slug)
  ) {
    return undefined;
  }

  const outcomePrices = parseOutcomePrices(market.outcomePrices);

  if (!outcomePrices) {
    return undefined;
  }

  return {
    id: slug,
    slug,
    conditionId,
    positionIds,
    title:
      market.question?.trim() ||
      market.groupItemTitle?.trim() ||
      slug,
    outcomes: inferComboOutcomes(slug),
    outcomePrices,
    image: context.image,
    volume: parseComboVolume(market.volume),
  };
}

function resolveComboMarketPositionIds(
  market: ProphetPolyMarketMarket,
): [string, string] | undefined {
  if (Array.isArray(market.positionIds) && market.positionIds.length >= 2) {
    return [String(market.positionIds[0]), String(market.positionIds[1])];
  }

  const fromClob = parseGammaArrayField(market.clobTokenIds).map(String);

  if (fromClob.length >= 2) {
    return [fromClob[0] ?? "0", fromClob[1] ?? "0"];
  }

  return undefined;
}

function resolveComboGameTeams(
  game: ProphetPolyMarketComboGame,
  slug: string,
): { homeTeam: ComboGameTeam; awayTeam: ComboGameTeam } {
  const teams = game.teams ?? [];
  const homeFromApi = teams.find((team) => team.ordering === "home") ?? teams[0];
  const awayFromApi = teams.find((team) => team.ordering === "away") ?? teams[1];
  const abbrevs = extractFixtureTeamAbbreviations(slug);
  const parsedTitle = parseTeamsFromTitle(game.title ?? "");

  const homeCode = abbrevs.homeAbbrev?.toUpperCase() ?? "HOME";
  const awayCode = abbrevs.awayAbbrev?.toUpperCase() ?? "AWAY";

  return {
    homeTeam: {
      name: homeFromApi?.name?.trim() || parsedTitle.homeName || homeCode,
      code: homeCode,
      logoUrl: resolveComboTeamLogoUrl(homeCode, homeFromApi?.logo),
    },
    awayTeam: {
      name: awayFromApi?.name?.trim() || parsedTitle.awayName || awayCode,
      code: awayCode,
      logoUrl: resolveComboTeamLogoUrl(awayCode, awayFromApi?.logo),
    },
  };
}

function resolveComboTeamLogoUrl(
  code: string,
  apiLogo?: string,
): string | undefined {
  const trimmed = apiLogo?.trim();

  if (
    trimmed &&
    (trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://"))
  ) {
    return trimmed;
  }

  return findCuratedTeamByCode(code)?.logoUrl;
}

function formatKickoffLabel(startTime: string | undefined): string {
  if (!startTime?.trim()) {
    return "TBD";
  }

  const parsed = new Date(startTime);

  if (Number.isNaN(parsed.getTime())) {
    return startTime.slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function parseOutcomePrices(
  value: string | undefined,
): [string, string] | undefined {
  const parsed = parseGammaArrayField(value).map(String);

  if (parsed.length < 2) {
    return undefined;
  }

  return [parsed[0] ?? "0", parsed[1] ?? "0"];
}

function inferComboOutcomes(slug: string): [string, string] {
  if (/-total-/i.test(slug)) {
    return ["Over", "Under"];
  }

  return ["Yes", "No"];
}

function parseComboVolume(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
