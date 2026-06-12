"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedRelativeTime } from "@/hooks/i18n/use-localized-relative-time";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";

import { formatImpactScore } from "./format";
import { SentimentColor, SentimentIcon } from "./icons";
import { NewsItemThumbnail } from "./news-item-thumbnail";
import type { NewsImpactItem } from "./types";

export type NewsItemProps = {
  item: NewsImpactItem;
  onSelect?: () => void;
  className?: string;
};

export function NewsItem({ item, onSelect, className }: NewsItemProps) {
  const t = useTranslations("signal");
  const teamDisplayName = useLocalizedTeamName(item.teamCode, item.teamName);
  const publishedAtLabel = useLocalizedRelativeTime(item.publishedAt);
  const impactLabel = formatImpactScore(item.impactScore);

  return (
    <article
      className={cn(
        "relative rounded-[12px] px-3 py-3 md:px-[12px] md:py-[12px]",
        item.highlighted && "bg-[#F9FAFC]",
        onSelect && "cursor-pointer duration-150 hover:bg-[#EDEDED]",
        className
      )}
      aria-label={t("newsCardAria", {
        teamName: teamDisplayName,
        headline: item.headline,
        impact: impactLabel
      })}
    >
      {onSelect ? (
        <button
          type="button"
          className="absolute inset-0 z-[1] rounded-[12px] opacity-0"
          aria-label={t("openDetailsFor", { headline: item.headline })}
          onClick={onSelect}
        />
      ) : null}
      <div className="flex items-start gap-3 md:items-center md:gap-[12px]">
        <NewsItemThumbnail
          alt={item.thumbnailAlt}
          imageUrl={item.thumbnailUrl}
          className="size-14 md:size-[72px]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 md:justify-start md:gap-[8px]">
            <div className="flex min-w-0 items-center gap-2 md:gap-[8px]">
              <TeamFlag
                code={item.teamCode}
                name={item.teamName}
                className="h-4 w-4 shrink-0 rounded-[4px] text-[16px] md:h-[20px] md:w-[20px] md:text-[20px]"
                fallback={false}
              />
              <span className="truncate text-base font-[500] leading-[19px] text-black md:text-[18px] md:leading-[21px]">
                {teamDisplayName}
              </span>
              <SentimentIcon sentiment={item.sentiment} />
            </div>
            <span className="shrink-0 whitespace-nowrap text-[12px] font-[400] leading-[14px] text-[#909090] md:hidden">
              {publishedAtLabel}
            </span>
          </div>

          <h3 className="m-0 mt-1 line-clamp-2 md:line-clamp-1 text-base font-[500] leading-[19px] text-black md:mt-[4px] md:text-[18px] md:leading-[21px]">
            {item.headline}
          </h3>

          <p
            className="m-0 mt-1 line-clamp-3 text-[14px] font-[400] leading-[17px] text-[#909090] md:mt-[4px] md:line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.summary }}
          ></p>

          <div className="mt-2 flex items-baseline justify-between md:hidden">
            <span className="text-[12px] font-[400] leading-[14px] text-[#909090]">
              {t("impact")}
            </span>
            <span
              className={cn(
                "text-base font-[500] leading-[19px]",
                SentimentColor({ sentiment: item.sentiment })
              )}
            >
              {impactLabel}
            </span>
          </div>
        </div>

        <div className="hidden min-w-[66px] shrink-0 flex-col items-end md:flex">
          <span className="whitespace-nowrap text-[12px] font-[400] leading-[14px] text-[#909090]">
            {publishedAtLabel}
          </span>
          <span
            className={cn(
              "mt-[8px] text-[18px] font-[500] leading-[21px]",
              SentimentColor({ sentiment: item.sentiment })
            )}
          >
            {impactLabel}
          </span>
          <span className="mt-[2px] text-[12px] font-[400] leading-[14px] text-[#909090]">
            {t("impact")}
          </span>
        </div>
      </div>
    </article>
  );
}
