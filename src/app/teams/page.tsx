import { TeamsPage } from "../../components/teams-list/TeamsPage";
import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";

export const dynamic = "force-dynamic";

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
