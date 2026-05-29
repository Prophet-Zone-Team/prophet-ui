import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HomeHeroTitleIconCycle } from "@/views/home/header/home-hero-title-icon-cycle";

const WORLD_CUP_2026_KICKOFF = new Date(Date.UTC(2026, 5, 11, 18, 0, 0));

export interface HomeHeroProps {
  totalVolumeLabel: ReactNode;
  topMoveValue: ReactNode;
}

export function HomeHero({ totalVolumeLabel, topMoveValue }: HomeHeroProps) {
  const kickoffLabel = formatKickoffCountdown(WORLD_CUP_2026_KICKOFF);

  return (
    <section className="flex justify-between py-8">
      <div className="flex-1 px-3 md:px-0">
        <div className="flex items-start gap-5">
          <img
            src="/fifa.png"
            className="block md:hidden w-[80px] object-top object-contain shrink-0"
          />
          <div className="flex-1">
            <p className="text-[20px] md:text-[26px]">2026 FIFA World Cup</p>
            <h1 className="mt-[8px] flex flex-col md:flex-row items-start md:items-center gap-[8px] text-[26px] md:text-[56px] font-[500] leading-[0.9]">
              <span>Before the news, </span>
              <span className="flex items-center gap-[8px]">
                <span>it moves</span>
                <HomeHeroTitleIconCycle className="w-[40px] h-[40px] md:w-[56px] md:h-[56px]" />
              </span>
            </h1>
            <p className="text-[#909090] text-[14px] mt-[8px]">
              source: Polymarket
            </p>
          </div>
        </div>
        <div
          className="md:flex md:justify-between mt-2 md:w-[806px] grid grid-cols-2 gap-y-2 md:gap-y-0"
          aria-label="World Cup market summary"
        >
          <HomeHeroStat label="Teams Listed" value={48} />
          <HomeHeroStat label="Total Volume" value={totalVolumeLabel} />
          <HomeHeroStat label="24h Changes" value={topMoveValue} />
          <HomeHeroStat label="Starts in" value={kickoffLabel} />
        </div>
      </div>
      <img
        src="/fifa.png"
        className="hidden md:block w-[180px] object-center object-contain shrink-0"
      />
    </section>
  );
}

const heroStatValueClassName =
  "text-[26px] md:text-[32px] font-[556] leading-[38px] text-black";

function HomeHeroStat({ label, value }: { label: string; value: ReactNode }) {
  const valueContent =
    typeof value === "string" || typeof value === "number" ? (
      <HomeHeroStatValue>{value}</HomeHeroStatValue>
    ) : (
      value
    );

  return (
    <div className="px-2 md:p-3 text-center">
      <div className="flex min-h-[38px] items-center justify-center text-[26px] md:text-[32px] font-[500] leading-[38px] text-black">
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
