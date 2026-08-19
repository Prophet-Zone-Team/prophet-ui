"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatVolume } from "@/components/home/market-formatters";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { formatScheduleKickoff } from "@/lib/market/schedule-match";
import type { Team, WorldCupMatch } from "@/types/market";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";

export type GameTrackMetaBarProps = {
  match: WorldCupMatch;
  homeTeam: Team;
  awayTeam: Team;
  volume: number;
};

export type GameTrackTitleProps = {
  title: string;
};

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatKickoffTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale.toLowerCase().startsWith("en") ? true : undefined
  }).format(date);
}

function useGameTrackKickoffLabel(iso: string | undefined): string {
  const t = useTranslations("tracks");
  const locale = useLocale();
  const fallback = formatScheduleKickoff(iso);

  if (!iso) {
    return fallback;
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const time = formatKickoffTime(date, locale);

  if (isSameCalendarDay(date, now)) {
    return t("kickoffToday", { time });
  }

  if (isSameCalendarDay(date, tomorrow)) {
    return t("kickoffTomorrow", { time });
  }

  return fallback;
}

export function GameTrackMetaBar({
  match,
  homeTeam,
  awayTeam,
  volume
}: GameTrackMetaBarProps) {
  const t = useTranslations("tracks");
  const homeDisplayName = useLocalizedTeamName(homeTeam.code, homeTeam.name);
  const awayDisplayName = useLocalizedTeamName(awayTeam.code, awayTeam.name);
  const kickoffLabel = useGameTrackKickoffLabel(match.kickoffAt);
  const volumeLabel = `$${formatVolume(volume)}`;

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <p className="m-0 min-w-0 truncate text-[14px] font-[400] leading-[18px] text-[#909090]">
        {kickoffLabel} | {volumeLabel} {t("volumeShort")}
      </p>
      <MatchBookmarkControl
        matchId={match.id}
        homeTeamName={homeDisplayName}
        awayTeamName={awayDisplayName}
      />
    </div>
  );
}

export function GameTrackTitle({ title }: GameTrackTitleProps) {
  return (
    <h3 className="m-0 w-full shrink-0 line-clamp-2 text-[20px] font-[500] leading-[26px] text-prophet-foreground md:max-w-[259px] md:text-[26px] md:leading-[33px]">
      {title}
    </h3>
  );
}
