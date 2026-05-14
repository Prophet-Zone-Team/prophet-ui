import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { BidPage } from "../../components/bid/BidPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    source: "polymarket",
    includeNews: false,
    includeFootballContext: false,
  });

  return <BidPage snapshots={marketData.snapshots} dataStatus={marketData.meta} />;
}
