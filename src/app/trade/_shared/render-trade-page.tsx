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
import type { TeamMarketSnapshot, TradeViewMode, WorldCupMatch } from "@/types/market";
import SimplePage from "@/views/trade/simple";
import ProfessionalPage from "@/views/trade/professional";

function resolveTradeMarketOptions(
  slug: string,
  footballMatch: WorldCupMatch | undefined,
  mode: TradeViewMode
): WorldCupMarketDataOptions {
  const isTeam = worldCupTeams.some((team) => team.id === slug);
  const footballContextTeamIds = footballMatch
    ? [footballMatch.homeTeamId, footballMatch.awayTeamId].filter(
        (teamId): teamId is string => Boolean(teamId)
      )
    : isTeam
      ? [slug]
      : undefined;

  if (mode === "simple") {
    return {
      includeFootballContext: Boolean(footballContextTeamIds?.length),
      includeNews: false,
      includeOdds: false,
      includeHistory: false,
      footballContextTeamIds
    };
  }

  return {
    includeFootballContext: Boolean(footballContextTeamIds?.length),
    includeNews: false,
    footballContextTeamIds
  };
}

export async function renderTradePage(slug: string, mode: TradeViewMode) {
  const { matches } = await getFootballMatches();
  const footballMatch = findWorldCupMatch(slug, matches);
  const marketData = await getWorldCupMarketData(
    resolveTradeMarketOptions(slug, footballMatch, mode)
  );
  const teamSnapshot = marketData.snapshots.find((item) => item.team.id === slug);

  if (teamSnapshot) {
    return renderTeamTrade(mode, teamSnapshot, marketData, matches);
  }

  if (footballMatch) {
    return renderGameTrade(mode, footballMatch, marketData, matches);
  }

  notFound();
}

async function renderTeamTrade(
  mode: TradeViewMode,
  snapshot: TeamMarketSnapshot,
  marketData: Awaited<ReturnType<typeof getWorldCupMarketData>>,
  matches: WorldCupMatch[]
) {
  if (mode === "simple") {
    const footballContext = marketData.footballTeamContext.find(
      (context) => context.profile.teamId === snapshot.team.id
    );
    const footballProfile =
      footballContext?.profile ??
      marketData.footballContext.find(
        (profile) => profile.teamId === snapshot.team.id
      );

    return (
      <SimplePage
        variant="team"
        snapshot={snapshot}
        profile={footballProfile}
        standings={footballContext?.standings}
        matches={matches}
        snapshots={marketData.snapshots}
      />
    );
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
    <ProfessionalPage
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

function loadGameTradeData(
  match: WorldCupMatch,
  marketData: Awaited<ReturnType<typeof getWorldCupMarketData>>,
  matches: WorldCupMatch[]
) {
  const snapshot = buildGameMarketSnapshot(match, marketData.snapshots);
  const relatedMatches = getRelatedMatches(match, matches);

  return {
    snapshot,
    teamSnapshots: marketData.snapshots,
    relatedMatches: relatedMatches.length > 0 ? relatedMatches : matches,
    dataStatus: marketData.meta
  };
}

function renderGameTrade(
  _mode: TradeViewMode,
  match: WorldCupMatch,
  marketData: Awaited<ReturnType<typeof getWorldCupMarketData>>,
  matches: WorldCupMatch[]
) {
  const gameData = loadGameTradeData(match, marketData, matches);
  const teamProfiles = Object.fromEntries(
    marketData.footballTeamContext.map((context) => [
      context.profile.teamId,
      context.profile
    ])
  );

  return (
    <SimplePage
      variant="game"
      match={match}
      snapshots={gameData.teamSnapshots}
      gameSnapshot={gameData.snapshot}
      teamProfiles={teamProfiles}
      relatedMatches={gameData.relatedMatches}
    />
  );
}
