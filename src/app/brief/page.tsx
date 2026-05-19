import { BriefPage } from "../../components/brief/BriefPage";
import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";

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
