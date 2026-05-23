import { notFound } from "next/navigation";

import { GameTradePage } from "@/components/trade/game-trade-page";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
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
import { parseTradeViewMode } from "@/lib/routes/trade";

interface GameTradeRouteProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams
}: GameTradeRouteProps) {
  const { slug } = await params;
  const { mode: modeParam } = await searchParams;
  const mode = parseTradeViewMode(modeParam);

  const marketData = await getWorldCupMarketData({
    includeFootballContext: true
  });
  const match = findWorldCupMatch(slug, marketData.footballTeamContext);

  if (!match) {
    notFound();
  }

  const teamSnapshots = marketData.snapshots;
  const snapshot = buildGameMarketSnapshot(match, teamSnapshots);
  const probabilityHistory = buildGameProbabilityHistory(snapshot);
  const matchMinuteHistory = buildGameMatchMinuteHistory(snapshot);
  const chartEvents = getGameMatchChartEvents(match);
  const allMatches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
  );
  const relatedMatches = getRelatedMatches(
    match,
    marketData.footballTeamContext
  );

  return (
    <GameTradePage
      mode={mode}
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      matchMinuteHistory={matchMinuteHistory}
      chartEvents={chartEvents}
      teamSnapshots={teamSnapshots}
      relatedMatches={relatedMatches.length > 0 ? relatedMatches : allMatches}
      dataStatus={marketData.meta}
    />
  );
}
