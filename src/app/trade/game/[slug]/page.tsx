import { notFound } from "next/navigation";

import { GameTradePage } from "../../../../components/trade/GameTradePage";
import { getWorldCupMarketData } from "../../../../data/providers/worldCupMarketData";
import {
  attachCachedFootballToMatches,
  getStaticWorldCupMatches
} from "../../../../data/world-cup-2026/matches";
import {
  buildGameMarketSnapshot,
  buildGameProbabilityHistory,
  findWorldCupMatch,
  getRelatedMatches
} from "../../../../lib/market/gameMarketSnapshot";

interface GameTradeRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: GameTradeRouteProps) {
  const { slug } = await params;
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
  const allMatches = attachCachedFootballToMatches(
    getStaticWorldCupMatches(),
    marketData.footballTeamContext
  );
  const relatedMatches = getRelatedMatches(match, marketData.footballTeamContext);

  return (
    <GameTradePage
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      teamSnapshots={teamSnapshots}
      relatedMatches={relatedMatches.length > 0 ? relatedMatches : allMatches}
      dataStatus={marketData.meta}
    />
  );
}
