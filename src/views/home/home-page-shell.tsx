"use client";

import type { ReactNode } from "react";

import { formatVolume } from "@/components/home/market-formatters";
import { TeamFlag } from "@/components/teams/team-flag";
import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import { usePolymarketStats } from "@/hooks/market/use-polymarket-stats";
import { HomeHero } from "@/views/home/header";
import { MarketListMetricLoading } from "@/views/home/home-data-loading";
import { HomeSectionNav } from "@/views/home/home-section-nav";

export interface HomePageShellProps {
  children: ReactNode;
}

const heroStatValueClassName =
  "text-[26px] font-[500] leading-[38px] text-black";

export function HomePageShell({ children }: HomePageShellProps) {
  const {
    volume,
    topMove,
    isLoading: isStatsLoading,
    isError: isStatsError
  } = usePolymarketStats();

  const totalVolumeLabel = isStatsLoading ? (
    <MarketListMetricLoading variant="volume" />
  ) : !isStatsError && volume !== undefined ? (
    `$${formatVolume(volume)}`
  ) : (
    "-"
  );

  const topMoveValue = (() => {
    if (isStatsLoading) {
      return <MarketListMetricLoading variant="probability" />;
    }

    if (isStatsError || !topMove || topMove.changePercent === undefined) {
      return "-";
    }

    return (
      <div className="inline-flex items-center gap-[5px]">
        {topMove.team ? (
          <TeamFlag
            code={topMove.team.code}
            name={topMove.team.name}
            logoUrl={topMove.team.logoUrl}
            className="rounded-[2px] text-base text-[20px] shrink-0"
          />
        ) : null}
        <span className={heroStatValueClassName}>{topMove.teamCode}</span>
        <ProbabilityChangeTrend
          changePercent={topMove.changePercent}
          decimals={1}
        />
      </div>
    );
  })();

  return (
    <section className="mx-auto max-w-[1112px]">
      <HomeHero
        totalVolumeLabel={totalVolumeLabel}
        topMoveValue={topMoveValue}
      />

      <HomeSectionNav />

      <div role="tabpanel">{children}</div>
    </section>
  );
}
