import { MarketsPage } from "../../components/markets/MarketsPage";
import { getWorldCupMarketData } from "../../data/providers/worldCupMarketData";
import { parseMarketDataSource } from "../../data/providers/source";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    source?: string | string[];
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const source = parseMarketDataSource(params?.source);
  const marketData = await getWorldCupMarketData({ source, includeFootballContext: false });

  return (
    <MarketsPage
      snapshots={marketData.snapshots}
      dataStatus={marketData.meta}
      universe={marketData.universe}
    />
  );
}
