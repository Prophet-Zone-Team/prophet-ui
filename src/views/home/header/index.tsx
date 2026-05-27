import type { ReactNode } from "react";
import type { MarketDataMeta } from "@/data/providers/types";
import { getMarketDataSourceLabel } from "@/data/providers/source";
import type { TeamMarketSnapshot } from "@/types/market";
import { TeamFlag } from "@/components/teams/team-flag";
import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import { cn } from "@/lib/cn";
import {
  formatVolume,
  getRelativeChangePercent
} from "@/components/home/market-formatters";
import { HomeHeroTitleIconCycle } from "@/views/home/header/home-hero-title-icon-cycle";

const WORLD_CUP_2026_KICKOFF = new Date(Date.UTC(2026, 5, 11, 18, 0, 0));

export interface HomeHeroProps {
  teamCount: number;
  totalVolume: number;
  topMove?: TeamMarketSnapshot;
  dataSource: MarketDataMeta["source"];
}

export function HomeHero({
  teamCount,
  totalVolume,
  topMove,
  dataSource
}: HomeHeroProps) {
  const kickoffLabel = formatKickoffCountdown(WORLD_CUP_2026_KICKOFF);
  const changePercent = topMove
    ? getRelativeChangePercent(
        topMove.market.probability,
        topMove.market.change24h
      )
    : null;

  return (
    <section className="flex justify-between py-8">
      <div className="flex-1">
        <p className="text-[26px]">2026 FIFA World Cup</p>
        <h1 className="mt-[8px] flex items-center gap-[8px] text-[56px] font-[500] leading-[0.9]">
          <span>Before the news, it moves</span>
          <HomeHeroTitleIconCycle />
        </h1>
        <p className="text-[#909090] text-[14px] mt-[8px]">
          source: {getMarketDataSourceLabel(dataSource)}
        </p>
        <div
          className="flex justify-between mt-2 w-[806px]"
          aria-label="World Cup market summary"
        >
          <HomeHeroStat label="Teams Listed" value={String(teamCount)} />
          <HomeHeroStat
            label="Total Volume"
            value={`$${formatVolume(totalVolume)}`}
          />
          <HomeHeroStat
            label="24h Changes"
            value={
              topMove && changePercent !== null ? (
                <HomeHeroChangeValue
                  teamCode={topMove.team.code}
                  teamName={topMove.team.name}
                  changePercent={changePercent}
                />
              ) : (
                "-"
              )
            }
          />
          <HomeHeroStat label="Starts in" value={kickoffLabel} />
        </div>
      </div>
      <img src="/fifa.png" className="w-[180px]" />
    </section>
  );
}

const heroStatValueClassName =
  "text-[32px] font-[556] leading-[38px] text-black";

function HomeHeroStat({ label, value }: { label: string; value: ReactNode }) {
  const valueContent =
    typeof value === "string" || typeof value === "number" ? (
      <HomeHeroStatValue>{value}</HomeHeroStatValue>
    ) : (
      value
    );

  return (
    <div className="p-3 text-center">
      <div className="flex min-h-[38px] items-center justify-center text-[32px] font-[500] leading-[38px] text-black">
        {valueContent}
      </div>
      <span className="mt-1 block text-[14px] leading-tight text-black">
        {label}
      </span>
    </div>
  );
}

function HomeHeroStatValue({ children }: { children: ReactNode }) {
  return (
    <strong className={cn("block", heroStatValueClassName)}>{children}</strong>
  );
}

interface HomeHeroChangeValueProps {
  teamCode: string;
  teamName: string;
  changePercent: number;
}

function HomeHeroChangeValue({
  teamCode,
  teamName,
  changePercent
}: HomeHeroChangeValueProps) {
  return (
    <div className="inline-flex items-center gap-[5px]">
      <TeamFlag
        code={teamCode}
        name={teamName}
        className="rounded-[2px] text-base shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <span className={heroStatValueClassName}>{teamCode}</span>
      <ProbabilityChangeTrend changePercent={changePercent} />
    </div>
  );
}

function formatKickoffCountdown(target: Date, now = new Date()): string {
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return "Started";
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  return `${days}d ${hours}h ${minutes}m`;
}
