import { BriefPage } from "../../components/brief/brief-page";
import { getWorldCupMarketData } from "../../data/providers/world-cup-market-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData();

  return (
    <BriefPage
      snapshots={marketData.snapshots}
      newsEvents={marketData.newsEvents}
      dataStatus={marketData.meta}
    />
  );
}
