import { worldCupTeams } from "@/data/teams/world-cup-teams";
import { normalizeGammaSearchText } from "@/lib/market/polymarket-gamma";
import type {
  ProphetPolyMarketGameItem,
  ProphetPolyMarketMarket,
} from "@/types/prophet-api";
import type {
  MatchOddsOutcome,
  WorldCupMatch,
  WorldCupMatchStatus,
} from "@/types/market";

export function mapProphetGamesToMatches(
  games: ProphetPolyMarketGameItem[],
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
  game: ProphetPolyMarketGameItem,
): WorldCupMatch | undefined {
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

  const homeTeam = findWorldCupTeamByName(homeName);
  const awayTeam = findWorldCupTeamByName(awayName);
  const eventId = game.event_id?.trim() || slug;
  const lastUpdated = game.start_time ?? new Date().toISOString();
  const volume = parseProphetVolume(game.volume);
  const oddsOutcomes = buildOddsFromProphetMarkets(
    game.markets,
    homeName,
    awayName,
    lastUpdated,
  );

  return {
    id: slug,
    matchId: hashFixtureId(eventId),
    stage: "EXTERNAL",
    homeTeamId: homeTeam?.id,
    awayTeamId: awayTeam?.id,
    homeDisplayName: homeName,
    awayDisplayName: awayName,
    homeSeed: homeTeam ? undefined : homeName,
    awaySeed: awayTeam ? undefined : awayName,
    status: mapProphetGameStatus(game),
    kickoffAt: game.start_time,
    league: "FIFA World Cup",
    odds:
      oddsOutcomes.length >= 3
        ? {
            source: "polymarket",
            status: "live",
            outcomes: oddsOutcomes,
            lastUpdated,
          }
        : undefined,
    freshness: {
      source: "prophet-api",
      status: "live",
      lastUpdated,
    },
    polymarket: {
      eventId,
      slug,
      volume,
      moneyline: {
        acceptingOrders: game.active === 1,
        outcomes: [],
      },
    },
  };
}

function resolveProphetFixtureSides(game: ProphetPolyMarketGameItem): {
  homeName?: string;
  awayName?: string;
} {
  const teamNames = (game.teams ?? [])
    .map((team) => team.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (teamNames.length >= 2) {
    return {
      homeName: teamNames[0],
      awayName: teamNames[1],
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
    awayName: parts[1]?.trim(),
  };
}

function mapProphetGameStatus(game: ProphetPolyMarketGameItem): WorldCupMatchStatus {
  if (game.closed === 1) {
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

function buildOddsFromProphetMarkets(
  markets: ProphetPolyMarketMarket[] | null | undefined,
  homeName: string,
  awayName: string,
  lastUpdated: string,
): MatchOddsOutcome[] {
  if (!markets?.length) {
    return [];
  }

  const outcomes: MatchOddsOutcome[] = [];

  for (const market of markets) {
    const labels = market.outcomes ?? [];
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
        lastUpdated,
      });
    }
  }

  return outcomes;
}

function normalizeOutcomeLabel(
  label: string,
  homeName: string,
  awayName: string,
): string {
  const normalized = normalizeGammaSearchText(label);

  if (["draw", "tie", "x", "d"].includes(normalized) || normalized.includes("draw")) {
    return "Draw";
  }

  const home = normalizeGammaSearchText(homeName);
  const away = normalizeGammaSearchText(awayName);

  if (normalized === home || normalized.includes(home) || home.includes(normalized)) {
    return homeName;
  }

  if (normalized === away || normalized.includes(away) || away.includes(normalized)) {
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

function findWorldCupTeamByName(name: string) {
  const normalized = normalizeGammaSearchText(name);

  return worldCupTeams.find((team) => {
    const aliases = [team.name, team.code, ...(team.aliases ?? [])].map(
      normalizeGammaSearchText,
    );

    return aliases.some(
      (alias) =>
        alias &&
        (normalized === alias ||
          normalized.includes(alias) ||
          alias.includes(normalized)),
    );
  });
}

function hashFixtureId(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % 1_000_000 || 1;
}
