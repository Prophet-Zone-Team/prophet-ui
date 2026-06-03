import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { formatImpactScore } from "./format";
import { NegativeSentimentIcon, PositiveSentimentIcon } from "./icons";
import { NewsItemThumbnail } from "./news-item-thumbnail";
import type { NewsImpactItem } from "./types";

export type NewsItemProps = {
  item: NewsImpactItem;
  onSelect?: () => void;
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

export function NewsItem({ item, onSelect, className }: NewsItemProps) {

  return (
    <article
      className={cn(
        "relative rounded-[12px] px-3 py-3 md:px-[12px] md:py-[12px]",
        item.highlighted && "bg-[#F9FAFC]",
        onSelect && "cursor-pointer duration-150 hover:bg-[#EDEDED]",
        className
      )}
      aria-label={`${item.teamName}: ${item.headline}. Impact ${formatImpactScore(item.impactScore)}`}
    >
      {onSelect ? (
        <button
          type="button"
          className="absolute inset-0 z-[1] rounded-[12px] opacity-0"
          aria-label={`Open details for ${item.headline}`}
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
                {item.teamName}
              </span>
              <SentimentIcon sentiment={item.sentiment} />
            </div>
            <span className="shrink-0 whitespace-nowrap text-[12px] font-[400] leading-[14px] text-[#909090] md:hidden">
              {item.publishedAtLabel}
            </span>
          </div>

          <h3 className="m-0 mt-1 line-clamp-2 md:line-clamp-1 text-base font-[500] leading-[19px] text-black md:mt-[4px] md:text-[18px] md:leading-[21px]">
            {item.headline}
          </h3>

          <p className="m-0 mt-1 line-clamp-3 text-[14px] font-[400] leading-[17px] text-[#909090] md:mt-[4px] md:line-clamp-2">
            {item.summary}
          </p>

          <div className="mt-2 flex items-baseline justify-between md:hidden">
            <span className="text-[12px] font-[400] leading-[14px] text-[#909090]">
              Impact
            </span>
            <span
              className={cn(
                "text-base font-[500] leading-[19px]",
                item.sentiment === "positive" ? "text-[#7BCA25]" : "",
                item.sentiment === "negative" ? "text-[#FF674B]" : "",
              )}
            >
              {formatImpactScore(item.impactScore)}
            </span>
          </div>
        </div>

        <div className="hidden min-w-[66px] shrink-0 flex-col items-end md:flex">
          <span className="whitespace-nowrap text-[12px] font-[400] leading-[14px] text-[#909090]">
            {item.publishedAtLabel}
          </span>
          <span
            className={cn(
              "mt-[8px] text-[18px] font-[500] leading-[21px]",
              item.sentiment === "positive" ? "text-[#7BCA25]" : "",
              item.sentiment === "negative" ? "text-[#FF674B]" : "",
            )}
          >
            {formatImpactScore(item.impactScore)}
          </span>
          <span className="mt-[2px] text-[12px] font-[400] leading-[14px] text-[#909090]">
            Impact
          </span>
        </div>
      </div>
    </article>
  );
}
