"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useAnalyticsRecommends } from "@/hooks/analytics/use-analytics-recommends";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";

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

const CATEGORY_LABEL_KEYS = {
  champion: "mostLikelyChampion",
  darkHorse: "darkHorse",
  hardestPath: "hardestPath",
  topAdvantage: "topAdvantage"
} as const;

const CATEGORY_DESCRIPTION_KEYS = {
  mostLikelyChampion: "mostLikelyChampionDescription",
  darkHorse: "darkHorseDescription",
  hardestPath: "hardestPathDescription",
  topAdvantage: "topAdvantageDescription"
} as const;

function AnalyticsTopCard({
  card
}: {
  card: {
    iconKey?: string;
    categoryLabel: string;
    teamCode: string;
    teamName: string;
    description: string;
    link?: string;
  };
}) {
  const t = useTranslations("analytics");
  const iconKey = card.iconKey ?? "";
  const categoryKey =
    CATEGORY_LABEL_KEYS[iconKey as keyof typeof CATEGORY_LABEL_KEYS] ??
    "mostLikelyChampion";
  const descriptionKey =
    CATEGORY_DESCRIPTION_KEYS[
      categoryKey as keyof typeof CATEGORY_DESCRIPTION_KEYS
    ] ?? "mostLikelyChampionDescription";
  const teamDisplayName = useLocalizedTeamName(card.teamCode, card.teamName);

  return (
    <TopAnalyticsCard
      icon={ICON_BY_KEY[iconKey] ?? <ChampionIcon />}
      categoryLabel={t(categoryKey)}
      teamCode={card.teamCode}
      teamName={teamDisplayName}
      description={t(descriptionKey)}
      link={card.link}
    />
  );
}

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
            className="box-border flex h-[145px] items-center justify-center rounded-[12px] border border-prophet-line bg-prophet-panel"
          >
            <span className="text-[14px] text-prophet-muted">{t("loading")}</span>
          </div>
        ))}
      </section>
    );
  }

  if (isError || cards.length === 0) {
    return (
      <section
        aria-label={t("topHighlights")}
        className="rounded-[12px] border border-prophet-line bg-prophet-panel px-4 py-8 text-center text-[14px] text-prophet-muted"
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
        <AnalyticsTopCard
          key={card.iconKey ?? card.categoryLabel}
          card={card}
        />
      ))}
    </section>
  );
}
