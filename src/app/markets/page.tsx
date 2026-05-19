import { MarketsPage } from "../../components/markets/MarketsPage";
import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({ includeFootballContext: false });

  return (
    <MarketsPage
      snapshots={marketData.snapshots}
      dataStatus={marketData.meta}
      universe={marketData.universe}
    />
  );
}
