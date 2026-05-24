import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { HomeWinnerPanel, sortHomeTeams } from "@/views/home";

export default async function FifaWinnerPage() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: false,
    includeNews: false,
    includeOdds: false
  });
  const teams = sortHomeTeams(marketData.snapshots);

  return (
    <HomeWinnerPanel
      teams={teams}
      dataStatus={marketData.meta}
      probabilityHistory={marketData.probabilityHistory}
    />
  );
}
