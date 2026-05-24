import type { ReactNode } from "react";

import type {
  MarketDataMeta,
  WorldCupMarketData
} from "@/data/providers/types";
import type { TeamMarketSnapshot } from "@/types/market";
import { HomeHero } from "@/views/home/header";
import { computeHomeHeroStats } from "@/views/home/home-hero-stats";
import { HomeSectionNav } from "@/views/home/home-section-nav";

export interface HomePageShellProps {
  snapshots: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
  universe?: WorldCupMarketData["universe"];
  children: ReactNode;
}

export function HomePageShell({
  snapshots,
  dataStatus,
  universe,
  children
}: HomePageShellProps) {
  const { teams, totalVolume, topMove, dataSource } = computeHomeHeroStats(
    snapshots,
    dataStatus,
    universe
  );

  return (
    <section className="mx-auto max-w-[1112px]">
      <HomeHero
        teamCount={teams.length}
        totalVolume={totalVolume}
        topMove={topMove}
        dataSource={dataSource}
      />

      <HomeSectionNav />

      <div role="tabpanel">{children}</div>
    </section>
  );
}
