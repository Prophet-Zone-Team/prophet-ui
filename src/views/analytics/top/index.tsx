"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useAnalyticsRecommends } from "@/hooks/analytics/use-analytics-recommends";

import { TopAnalyticsCard } from "@/views/analytics/top/card";
import {
  ChampionIcon,
  DarkHorseIcon,
  HardestPathIcon,
  TopAdvantageIcon
} from "./icons";

const ICON_BY_KEY: Record<string, ReactNode> = {
  champion: <ChampionIcon />,
  darkHorse: <DarkHorseIcon />,
  hardestPath: <HardestPathIcon />,
  topAdvantage: <TopAdvantageIcon />
};

export function AnalyticsTopSection() {
  const t = useTranslations("analytics");
  const { cards, isLoading, isError } = useAnalyticsRecommends();

  if (isLoading) {
    return (
      <section
        aria-label={t("topHighlights")}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="box-border flex h-[145px] items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white"
          >
            <span className="text-[14px] text-[#909090]">{t("loading")}</span>
          </div>
        ))}
      </section>
    );
  }

  if (isError || cards.length === 0) {
    return (
      <section
        aria-label={t("topHighlights")}
        className="rounded-[12px] border border-[#EBEBEB] bg-white px-4 py-8 text-center text-[14px] text-[#909090]"
      >
        {t("unableToLoadData")}
      </section>
    );
  }

  return (
    <section
      aria-label={t("topHighlights")}
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {cards.map((card) => (
        <TopAnalyticsCard
          key={card.iconKey ?? card.categoryLabel}
          icon={ICON_BY_KEY[card.iconKey ?? ""] ?? <ChampionIcon />}
          categoryLabel={card.categoryLabel}
          teamCode={card.teamCode}
          teamName={card.teamName}
          description={card.description}
          link={card.link}
        />
      ))}
    </section>
  );
}
