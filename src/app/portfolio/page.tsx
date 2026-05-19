import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { PortfolioPage } from "../../components/portfolio/PortfolioPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const marketData = await getWorldCupMarketData({
    includeNews: false,
    includeFootballContext: false,
  });

  return <PortfolioPage snapshots={marketData.snapshots} dataStatus={marketData.meta} />;
}
