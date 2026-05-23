import { notFound } from "next/navigation";

import { getTheOddsApiWorldCupWinnerOdds } from "@/data/odds/the-odds-api-provider";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import type { WorldCupMarketDataOptions } from "@/data/providers/types";
import { worldCupTeams } from "@/data/teams/world-cup-teams";
import {
  attachCachedFootballToMatches,
  getStaticWorldCupMatches
} from "@/data/world-cup-2026/matches";
import {
  buildGameMarketSnapshot,
  buildGameMatchMinuteHistory,
  buildGameProbabilityHistory,
  findWorldCupMatch,
  getGameMatchChartEvents,
  getRelatedMatches
} from "@/lib/market/game-market-snapshot";
import type { TradeViewMode } from "@/types/market";
import SimplePage from "@/views/trade/simple";
import ProfessionalPage from "@/views/trade/professional";

function resolveTradeMarketOptions(
  slug: string,
  mode: TradeViewMode
): WorldCupMarketDataOptions {
  const staticMatch = getStaticWorldCupMatches().find(
    (match) => match.id === slug
  );
  const isTeam = worldCupTeams.some((team) => team.id === slug);
  const footballContextTeamIds = staticMatch
    ? [staticMatch.homeTeamId, staticMatch.awayTeamId].filter(
        (teamId): teamId is string => Boolean(teamId)
      )
    : isTeam
      ? [slug]
      : undefined;

  if (mode === "simple") {
    return {
      includeFootballContext: true,
      includeNews: false,
      includeOdds: false,
      includeHistory: false,
      footballContextTeamIds
    };
  }

  return {
    includeFootballContext: true,
    includeNews: false,
    footballContextTeamIds
  };
}

export async function renderTradePage(slug: string, mode: TradeViewMode) {
  const marketData = await getWorldCupMarketData(
    resolveTradeMarketOptions(slug, mode)
  );
  const teamSnapshot = marketData.snapshots.find(
    (item) => item.team.id === slug
  );

  if (teamSnapshot) {
    return renderTeamTrade(mode, teamSnapshot, marketData);
  }

  const match = findWorldCupMatch(slug, marketData.footballTeamContext);

  if (match) {
    return renderGameTrade(mode, match, marketData);
  }

  notFound();
}

async function renderTeamTrade(
  mode: TradeViewMode,
  snapshot: NonNullable<
    Awaited<ReturnType<typeof getWorldCupMarketData>>["snapshots"][number]
  >,
  marketData: Awaited<ReturnType<typeof getWorldCupMarketData>>
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

    const matches = attachCachedFootballToMatches(
      getStaticWorldCupMatches(),
      marketData.footballTeamContext
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
  const matches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
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
  match: NonNullable<ReturnType<typeof findWorldCupMatch>>,
  marketData: Awaited<ReturnType<typeof getWorldCupMarketData>>
) {
  const teamSnapshots = marketData.snapshots;
  const snapshot = buildGameMarketSnapshot(match, teamSnapshots);
  const allMatches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
  );
  const relatedMatches = getRelatedMatches(
    match,
    marketData.footballTeamContext
  );

  return {
    snapshot,
    probabilityHistory: buildGameProbabilityHistory(snapshot),
    matchMinuteHistory: buildGameMatchMinuteHistory(snapshot),
    chartEvents: getGameMatchChartEvents(match),
    teamSnapshots,
    relatedMatches: relatedMatches.length > 0 ? relatedMatches : allMatches,
    dataStatus: marketData.meta
  };
}

function renderGameTrade(
  _mode: TradeViewMode,
  match: NonNullable<ReturnType<typeof findWorldCupMatch>>,
  marketData: Awaited<ReturnType<typeof getWorldCupMarketData>>
) {
  const gameData = loadGameTradeData(match, marketData);
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
