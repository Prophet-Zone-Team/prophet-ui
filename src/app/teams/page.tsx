import { TeamsPage } from "@/views/teams";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: true,
  });

  return (
    <TeamsPage
      snapshots={marketData.snapshots}
      newsEvents={marketData.newsEvents}
      footballTeamContext={marketData.footballTeamContext}
      footballMetadata={marketData.footballMetadata}
      dataStatus={marketData.meta}
      universe={marketData.universe}
    />
  );
}
