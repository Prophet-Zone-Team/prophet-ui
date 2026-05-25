import { notFound } from "next/navigation";

import { getTheOddsApiWorldCupWinnerOdds } from "@/data/odds/the-odds-api-provider";
import { getFootballMatches } from "@/data/providers/football-matches";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import type { WorldCupMarketDataOptions } from "@/data/providers/types";
import { worldCupTeams } from "@/data/teams/world-cup-teams";
import {
  buildGameMarketSnapshot,
  findWorldCupMatch,
  getRelatedMatches
} from "@/lib/market/game-market-snapshot";
import type { WorldCupMatch } from "@/types/market";
import TradeGameView from "@/views/trade/game";
import TradeTeamView from "@/views/trade/team";

function resolveGameMarketOptions(
  footballMatch: WorldCupMatch
): WorldCupMarketDataOptions {
  const footballContextTeamIds = [
    footballMatch.homeTeamId,
    footballMatch.awayTeamId
  ].filter((teamId): teamId is string => Boolean(teamId));

  return {
    includeFootballContext: Boolean(footballContextTeamIds.length),
    includeNews: false,
    includeOdds: false,
    includeHistory: false,
    footballContextTeamIds
  };
}

function resolveTeamMarketOptions(teamId: string): WorldCupMarketDataOptions {
  return {
    includeFootballContext: true,
    includeNews: false,
    footballContextTeamIds: [teamId]
  };
}

export async function renderGameTradePage(slug: string) {
  const { matches } = await getFootballMatches();
  const footballMatch = findWorldCupMatch(slug, matches);

  if (!footballMatch) {
    notFound();
  }

  const marketData = await getWorldCupMarketData(
    resolveGameMarketOptions(footballMatch)
  );
  const snapshot = buildGameMarketSnapshot(footballMatch, marketData.snapshots);
  const relatedMatches = getRelatedMatches(footballMatch, matches);
  const teamProfiles = Object.fromEntries(
    marketData.footballTeamContext.map((context) => [
      context.profile.teamId,
      context.profile
    ])
  );

  return (
    <TradeGameView
      match={footballMatch}
      snapshots={marketData.snapshots}
      gameSnapshot={snapshot}
      teamProfiles={teamProfiles}
      relatedMatches={
        relatedMatches.length > 0 ? relatedMatches : matches
      }
    />
  );
}

export async function renderTeamTradePage(slug: string) {
  if (!worldCupTeams.some((team) => team.id === slug)) {
    notFound();
  }

  const { matches } = await getFootballMatches();
  const marketData = await getWorldCupMarketData(resolveTeamMarketOptions(slug));
  const snapshot = marketData.snapshots.find((item) => item.team.id === slug);

  if (!snapshot) {
    notFound();
  }

  await getTheOddsApiWorldCupWinnerOdds();

  const probabilityHistory = marketData.probabilityHistory.filter(
    (point) => point.teamId === snapshot.team.id
  );
  const footballContext = marketData.footballTeamContext.find(
    (context) => context.profile.teamId === snapshot.team.id
  );
  const footballProfile =
    footballContext?.profile ??
    marketData.footballContext.find(
      (profile) => profile.teamId === snapshot.team.id
    );

  return (
    <TradeTeamView
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      matches={matches}
      snapshots={marketData.snapshots}
      footballProfile={footballProfile}
      footballMetadata={marketData.footballMetadata.find(
        (metadata) => metadata.teamId === snapshot.team.id
      )}
      dataStatus={marketData.meta}
    />
  );
}
