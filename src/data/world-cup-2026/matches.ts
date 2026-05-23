import type { ApiFootballTeamContext, WorldCupMatch } from "../../types/market";
import { KNOCKOUT_LINKS } from "./knockout-links";
import { ROUND_OF_32 } from "./round-of-32";
import { WORLD_CUP_2026_GROUPS, WORLD_CUP_2026_GROUP_ORDER } from "./groups";

const GROUP_PAIRINGS = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
] as const;

export function getStaticWorldCupMatches(): WorldCupMatch[] {
  return [
    ...getStaticGroupMatches(),
    ...ROUND_OF_32.map((match) => ({
      id: `m${match.matchId}`,
      matchId: match.matchId,
      stage: "R32" as const,
      homeSeed: match.left,
      awaySeed: match.right,
      status: "scheduled" as const,
      venue: match.venue,
      freshness: {
        source: "FIFA official schedule",
        status: "cached" as const,
      },
    })),
    ...KNOCKOUT_LINKS.map((match) => ({
      id: `m${match.matchId}`,
      matchId: match.matchId,
      stage: match.stage ?? "R16",
      homeSeed: match.left,
      awaySeed: match.right,
      status: "scheduled" as const,
      freshness: {
        source: "FIFA official knockout bracket",
        status: "cached" as const,
      },
    })),
  ];
}

export function attachCachedFootballToMatches(
  matches: WorldCupMatch[],
  contexts: ApiFootballTeamContext[],
): WorldCupMatch[] {
  return matches.map((match) => {
    if (!match.homeTeamId || !match.awayTeamId) {
      return match;
    }

    const fixture = findFixtureForMatch(match, contexts);

    if (!fixture) {
      return match;
    }

    const homeContext = contexts.find((context) => context.profile.teamId === match.homeTeamId);
    const odds = homeContext?.odds.filter((item) => item.fixtureId === fixture.fixtureId) ?? [];

    return {
      ...match,
      status: fixture.status,
      kickoffAt: fixture.kickoffAt,
      venue: fixture.venueName ?? match.venue,
      city: fixture.city ?? match.city,
      homeScore: fixture.homeAway === "home" ? fixture.goalsFor : fixture.goalsAgainst,
      awayScore: fixture.homeAway === "home" ? fixture.goalsAgainst : fixture.goalsFor,
      liveElapsedSeconds:
        fixture.status === "live" && fixture.elapsedMinutes !== undefined
          ? fixture.elapsedMinutes * 60
          : undefined,
      odds: odds.length > 0
        ? {
            source: "api-football",
            status: "cached",
            outcomes: odds.slice(0, 3).map((item) => ({
              label: item.selectionName ?? item.marketName ?? "Selection",
              decimalOdds: item.odd ? Number(item.odd) : undefined,
              bookmaker: item.bookmaker,
              lastUpdated: item.updatedAt,
            })),
            lastUpdated: odds.reduce<string | undefined>((latest, item) => !latest || item.updatedAt > latest ? item.updatedAt : latest, undefined),
          }
        : undefined,
      freshness: {
        source: "FIFA schedule + API-Football cache",
        status: "cached",
        lastUpdated: fixture.updatedAt,
      },
    };
  });
}

function getStaticGroupMatches(): WorldCupMatch[] {
  let matchId = 1;

  return WORLD_CUP_2026_GROUP_ORDER.flatMap((group) => {
    const teams = WORLD_CUP_2026_GROUPS[group];

    return GROUP_PAIRINGS.map(([homeIndex, awayIndex], index) => {
      const home = teams[homeIndex];
      const away = teams[awayIndex];

      return {
        id: `m${matchId}`,
        matchId: matchId++,
        stage: "GROUP" as const,
        group,
        homeTeamId: home.id,
        awayTeamId: away.id,
        status: "scheduled" as const,
        kickoffAt: getApproximateKickoff(group, index),
        freshness: {
          source: "FIFA official draw + generated group pairing order",
          status: "cached" as const,
        },
      };
    });
  });
}

function findFixtureForMatch(match: WorldCupMatch, contexts: ApiFootballTeamContext[]) {
  const homeContext = contexts.find((context) => context.profile.teamId === match.homeTeamId);
  const awayContext = contexts.find((context) => context.profile.teamId === match.awayTeamId);
  const awayName = awayContext?.profile.name.toLowerCase();

  return homeContext?.fixtures.find((fixture) => {
    return awayName && fixture.opponentName.toLowerCase().includes(awayName);
  });
}

function getApproximateKickoff(group: string, pairingIndex: number): string {
  const base = new Date(Date.UTC(2026, 5, 11, 18, 0, 0));
  const groupOffset = group.charCodeAt(0) - "A".charCodeAt(0);
  const matchdayOffset = Math.floor(pairingIndex / 2) * 5;
  base.setUTCDate(base.getUTCDate() + groupOffset + matchdayOffset);
  return base.toISOString();
}
