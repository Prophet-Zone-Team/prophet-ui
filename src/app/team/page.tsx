import { notFound } from "next/navigation";

import { TeamDetailPage } from "@/components/team/team-detail-page";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";

interface TeamPageProps {
  searchParams: Promise<{
    slug?: string;
  }>;
}

export default async function Page({ searchParams }: TeamPageProps) {
  const { slug } = await searchParams;

  if (!slug) {
    notFound();
  }

  const marketData = await getWorldCupMarketData({
    includeFootballContext: false
  });
  const snapshot = marketData.snapshots.find((item) => item.team.id === slug);

  if (!snapshot) {
    notFound();
  }

  return (
    <TeamDetailPage snapshot={snapshot} dataStatus={marketData.meta} />
  );
}
