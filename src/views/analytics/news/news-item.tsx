import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import { formatImpactScore } from "./format";
import { NegativeSentimentIcon, PositiveSentimentIcon } from "./icons";
import { NewsItemThumbnail } from "./news-item-thumbnail";
import type { NewsImpactItem } from "./types";

export type NewsItemProps = {
  item: NewsImpactItem;
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

export function NewsItem({ item, className }: NewsItemProps) {
  const isPositiveImpact = item.impactScore >= 0;

  return (
    <article
      className={cn(
        "rounded-[12px] px-[12px] py-[12px]",
        item.highlighted && "bg-[#F9FAFC]",
        className
      )}
      aria-label={`${item.teamName}: ${item.headline}. Impact ${formatImpactScore(item.impactScore)}`}
    >
      <div className="flex items-center gap-[12px]">
        <NewsItemThumbnail
          alt={item.thumbnailAlt}
          imageUrl={item.thumbnailUrl}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[8px]">
            <TeamFlag
              code={item.teamCode}
              name={item.teamName}
              className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
            />
            <span className="text-[18px] font-[500] leading-[21px] text-black">
              {item.teamName}
            </span>
            <SentimentIcon sentiment={item.sentiment} />
          </div>

          <h3 className="m-0 mt-[4px] text-[18px] font-[500] leading-[21px] text-black">
            {item.headline}
          </h3>

          <p className="m-0 mt-[4px] text-[14px] font-[400] leading-[17px] text-[#909090]">
            {item.summary}
          </p>
        </div>

        <div className="flex min-w-[66px] shrink-0 flex-col items-end">
          <span className="whitespace-nowrap text-[12px] font-[400] leading-[14px] text-[#909090]">
            {item.publishedAtLabel}
          </span>
          <span
            className={cn(
              "mt-[8px] text-[18px] font-[500] leading-[21px]",
              isPositiveImpact ? "text-[#7BCA25]" : "text-[#FF674B]"
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
