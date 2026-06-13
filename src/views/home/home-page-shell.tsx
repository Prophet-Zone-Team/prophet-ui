"use client";

import { useMemo, useState, type ReactNode } from "react";

import { formatVolume } from "@/components/home/market-formatters";
import { TeamFlag } from "@/components/teams/team-flag";
import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import { HomeHero } from "@/views/home/header";
import { MarketListMetricLoading } from "@/views/home/home-data-loading";
import { useTeams } from "@/views/home/hooks/use-teams";
import { computeHomeHeroStats } from "@/views/home/home-hero-stats";
import { HomeSectionNav } from "@/views/home/home-section-nav";
import { HomeSectionSearch } from "./home-section-search";
import { usePathname } from "next/navigation";
import { HomeProvider } from "./context";

export interface HomePageShellProps {
  children: ReactNode;
}

const heroStatValueClassName =
  "text-[26px] md:text-[32px] font-[500] leading-[38px] text-black";

export function HomePageShell({ children }: HomePageShellProps) {
  const { snapshots, totalVolume, status, isLoading } = useTeams();
  const pathname = usePathname();

  const isSearchInput = useMemo(() => [/^\/fifa\/groups/].some(pattern => pattern.test(pathname)), [pathname]);

  const { topMove } = computeHomeHeroStats(snapshots, {
    source: "polymarket",
    status: status === "ready" ? "live" : "partial",
    lastUpdated: new Date().toISOString(),
    stale: status !== "ready"
  });

  const totalVolumeLabel = isLoading ? (
    <MarketListMetricLoading variant="volume" />
  ) : status === "ready" && totalVolume !== undefined ? (
    `$${formatVolume(totalVolume)}`
  ) : (
    "-"
  );

  const topMoveValue = (() => {
    if (isLoading) {
      return <MarketListMetricLoading variant="probability" />;
    }

    if (status !== "ready" || !topMove) {
      return "-";
    }

    const changePercent = topMove.market.change24h;

    if (changePercent === null) {
      return "-";
    }

    return (
      <div className="inline-flex items-center gap-[5px]">
        <TeamFlag
          code={topMove.team.code}
          name={topMove.team.name}
          logoUrl={topMove.team.logoUrl}
          className="rounded-[2px] text-base"
        />
        <span className={heroStatValueClassName}>{topMove.team.code}</span>
        <ProbabilityChangeTrend changePercent={changePercent} decimals={1} />
      </div>
    );
  })();

  const [searchValue, setSearchValue] = useState("");

  return (
    <HomeProvider
      value={{
        searchValue,
        setSearchValue,
      }}
    >
      <section className="mx-auto max-w-[1112px]">
        <HomeHero
          totalVolumeLabel={totalVolumeLabel}
          topMoveValue={topMoveValue}
        />

        <div className="w-full flex justify-center md:justify-between items-center">
          <HomeSectionNav />
          {
            isSearchInput && (
              <HomeSectionSearch />
            )
          }
        </div>

        <div role="tabpanel">{children}</div>
      </section>
    </HomeProvider>
  );
}
