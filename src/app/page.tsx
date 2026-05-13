import { getWorldCupMarketData } from "../data/providers/worldCupMarketData";
import { parseMarketDataSource } from "../data/providers/source";
import { HomePage } from "../components/home/HomePage";

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

  return <HomePage snapshots={marketData.snapshots} newsEvents={marketData.newsEvents} dataStatus={marketData.meta} />;
}
