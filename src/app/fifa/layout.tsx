import type { ReactNode } from "react";

import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { HomePageShell } from "@/views/home";

export default async function FifaLayout({ children }: { children: ReactNode }) {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: false,
    includeNews: false,
    includeOdds: false
  });

  return (
    <HomePageShell
      snapshots={marketData.snapshots}
      dataStatus={marketData.meta}
      universe={marketData.universe}
    >
      {children}
    </HomePageShell>
  );
}
