import { getWorldCupMarketData } from "../../data/providers/world-cup-market-data";
import { PortfolioView } from "../../views/portfolio";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeNews: false,
    includeFootballContext: false
  });

  return (
    <PortfolioView snapshots={marketData.snapshots} dataStatus={marketData.meta} />
  );
}
