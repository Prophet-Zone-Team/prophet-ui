import { TeamFlag } from "@/components/teams/team-flag";
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
  const isPositiveImpact = item.impactScore >= 0;

  return (
    <article
      className={cn(
        "relative flex w-full max-w-none flex-col gap-2 rounded-[12px] bg-[#F9FAFC] px-3 py-3 transition-colors hover:bg-[#F0F2F5] md:h-[78px] md:max-w-[679px] md:flex-row md:items-center md:gap-4 md:px-5",
        onSelect && "cursor-pointer",
        className
      )}
      aria-label={`${item.teamName}: ${item.headline}. Impact ${formatImpactScore(item.impactScore)}`}
    >
      {onSelect ? (
        <button
          type="button"
          className="absolute inset-0 z-[1] rounded-[12px] opacity-0"
          aria-label={`Open details for ${item.headline}`}
          onClick={() => onSelect(item)}
        />
      ) : null}

      <div className="flex w-full shrink-0 items-center justify-between gap-2 md:w-[110px] md:flex-col md:items-start md:gap-1">
        <div className="flex min-w-0 items-center gap-2 md:gap-[8px]">
          <TeamFlag
            code={item.teamCode}
            name={item.teamName}
            className="h-4 w-4 shrink-0 rounded-[4px] text-[16px] shadow-[0_0_2px_rgba(0,0,0,0.2)] md:h-[20px] md:w-[20px] md:text-[20px]"
          />
          <span className="truncate text-[14px] font-[457] leading-[17px] text-black md:text-[16px] md:leading-[19px]">
            {item.teamName}
          </span>
        </div>
        <span className="shrink-0 whitespace-nowrap text-[12px] font-[457] leading-[14px] text-[#909090] md:mt-1 md:text-[14px] md:leading-[17px]">
          {item.publishedAtLabel}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 line-clamp-2 text-base font-[556] leading-[19px] text-black md:truncate md:text-[18px] md:leading-[21px]">
          {item.headline}
        </h3>
        <p className="m-0 mt-1 line-clamp-2 text-[14px] font-[457] leading-[17px] text-[#909090] md:mt-2 md:truncate md:whitespace-nowrap">
          {item.summary}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 md:justify-end md:gap-1">
        <span className="text-[12px] font-[457] leading-[14px] text-[#909090] md:hidden">
          Impact
        </span>
        <div className="flex items-center gap-1 md:gap-[4px]">
          <span className="shrink-0 [&_svg]:size-[18px]">
            <SentimentIcon sentiment={item.sentiment} />
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-base font-[556] leading-[19px] md:text-[18px] md:leading-[21px]",
              isPositiveImpact ? "text-[#7BCA25]" : "text-[#FF674B]"
            )}
          >
            {formatImpactScore(item.impactScore)}
          </span>
        </div>
      </div>
    </article>
  );
}
