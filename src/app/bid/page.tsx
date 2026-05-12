import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { parseMarketDataSource } from "../../data/providers/source";
import { BidPage } from "../../components/bid/BidPage";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    source?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const marketData = await getWorldCupMarketData({
    source: parseMarketDataSource(params?.source),
    includeNews: false,
    includeFootballContext: false,
  });

  return <BidPage snapshots={marketData.snapshots} dataStatus={marketData.meta} />;
}
