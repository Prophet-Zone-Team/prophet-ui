"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { HomeHeroTitleIconCycle } from "@/views/home/header/home-hero-title-icon-cycle";

const WORLD_CUP_2026_KICKOFF = new Date(Date.UTC(2026, 5, 11, 18, 0, 0));

export interface HomeHeroProps {
  totalVolumeLabel: ReactNode;
  topMoveValue: ReactNode;
}

export function HomeHero({ totalVolumeLabel, topMoveValue }: HomeHeroProps) {
  const t = useTranslations("home");
  const showKickoffCountdown = Date.now() < WORLD_CUP_2026_KICKOFF.getTime();
  const kickoffLabel = showKickoffCountdown
    ? formatKickoffCountdown(WORLD_CUP_2026_KICKOFF, t)
    : null;

  return (
    <section className="flex justify-between py-8">
      <div className="flex-1 px-3 md:px-0">
        <div className="flex items-start gap-5">
          <img
            src="/fifa.png"
            className="block md:hidden w-[80px] object-top object-contain shrink-0"
          />
          <div className="flex-1">
            <p className="text-[20px] md:text-[26px]">
              {t("fifaWorldCup2026")}
            </p>
            <h1 className="mt-[8px] flex flex-col md:flex-row items-start md:items-center gap-[8px] text-[26px] md:text-[56px] font-[500] leading-[0.9]">
              <span className="whitespace-nowrap">
                {t("heroTaglineBefore")}{" "}
              </span>
              <span className="flex items-center gap-[8px]">
                <span className="whitespace-nowrap">
                  {t("heroTaglineMoves")}
                </span>
                <HomeHeroTitleIconCycle className="w-[40px] h-[40px] md:w-[56px] md:h-[56px]" />
              </span>
            </h1>
            <p className="text-[#909090] text-[14px] mt-[8px]">
              {t("sourcePolymarket")}
            </p>
          </div>
        </div>
        <div
          className="md:flex md:justify-between mt-2 md:w-[806px] grid grid-cols-2 gap-y-2 md:gap-y-0"
          aria-label={t("worldCupMarketSummary")}
        >
          <HomeHeroStat label={t("teamsListed")} value={48} />
          <HomeHeroStat label={t("totalVolume")} value={totalVolumeLabel} />
          <HomeHeroStat label={t("changes24h")} value={topMoveValue} />
          {showKickoffCountdown ? (
            <HomeHeroStat label={t("startsIn")} value={kickoffLabel} />
          ) : null}
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
  "text-[26px] md:text-[32px] font-[500] leading-[38px] text-black";

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

function formatKickoffCountdown(
  target: Date,
  t: (
    key: "started" | "kickoffCountdown",
    values?: { days: number; hours: number; minutes: number }
  ) => string,
  now = new Date()
): string {
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return t("started");
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  return t("kickoffCountdown", { days, hours, minutes });
}
