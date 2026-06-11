"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { formatImpactScore } from "@/views/analytics/news/format";
import {
  NegativeSentimentIcon,
  PositiveSentimentIcon
} from "@/views/analytics/news/icons";
import type { NewsImpactItem } from "@/views/analytics/news/types";

export type SignalAllItemProps = {
  item: NewsImpactItem;
  onSelect?: (item: NewsImpactItem) => void;
  className?: string;
};

function SentimentIcon({
  sentiment
}: {
  sentiment: NewsImpactItem["sentiment"];
}) {
  if (sentiment === "negative") {
    return <NegativeSentimentIcon />;
  }

  return <PositiveSentimentIcon />;
}

export function SignalAllItem({ item, onSelect, className }: SignalAllItemProps) {
  const t = useTranslations("signal");
  const teamDisplayName = useLocalizedTeamName(item.teamCode, item.teamName);
  const impactLabel = formatImpactScore(item.impactScore);

  return (
    <article
      className={cn(
        "relative flex w-full max-w-none flex-col gap-2 rounded-[12px] bg-[#F9FAFC] px-3 py-3 transition-colors hover:bg-[#F0F2F5] md:h-[78px] md:flex-row md:items-center md:gap-4 md:px-5",
        onSelect && "cursor-pointer",
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
          onClick={() => onSelect(item)}
        />
      ) : null}

      <div className="flex w-full shrink-0 items-center justify-between gap-2 md:w-[110px] md:flex-col md:items-start md:gap-1">
        <div className="flex w-full flex-1 items-center gap-2 md:gap-[8px] overflow-hidden">
          <TeamFlag
            code={item.teamCode}
            name={item.teamName}
            className="h-4 w-4 shrink-0 rounded-[4px] text-[16px] md:h-[20px] md:w-[20px] md:text-[20px]"
            fallback={false}
          />
          <span className="truncate text-[14px] font-[400] leading-[17px] text-black md:text-[16px] md:leading-[19px]">
            {teamDisplayName}
          </span>
        </div>
        <span className="shrink-0 whitespace-nowrap text-[12px] font-[400] leading-[14px] text-[#909090] md:mt-1 md:text-[14px] md:leading-[17px]">
          {item.publishedAtFormatted}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 line-clamp-2 text-base font-[500] leading-[19px] text-black md:truncate md:text-[18px] md:leading-[21px]">
          {item.headline}
        </h3>
        <p
          className="m-0 mt-1 line-clamp-2 text-[14px] font-[400] leading-[17px] text-[#909090] md:mt-2 md:truncate md:whitespace-nowrap"
          dangerouslySetInnerHTML={{ __html: item.summary }}
        >
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 md:justify-end md:gap-1">
        <span className="text-[12px] font-[400] leading-[14px] text-[#909090] md:hidden">
          {t("impact")}
        </span>
        <div className="flex items-center gap-1 md:gap-[4px]">
          <span className="shrink-0 [&_svg]:size-[18px]">
            <SentimentIcon sentiment={item.sentiment} />
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-base font-[500] leading-[19px] md:text-[18px] md:leading-[21px]",
              item.sentiment === "positive" ? "text-[#7BCA25]" : "",
              item.sentiment === "negative" ? "text-[#FF674B]" : ""
            )}
          >
            {formatImpactScore(item.impactScore)}
          </span>
        </div>
      </div>
    </article>
  );
}
