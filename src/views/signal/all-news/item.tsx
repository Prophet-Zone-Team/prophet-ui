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

export function SignalAllItem({ item, className }: SignalAllItemProps) {
  const isPositiveImpact = item.impactScore >= 0;

  return (
    <article
      className={cn(
        "flex h-[78px] w-full max-w-[679px] items-center gap-[16px] rounded-[12px] bg-[#F9FAFC] transition-colors hover:bg-[#F0F2F5]",
        className
      )}
      aria-label={`${item.teamName}: ${item.headline}. Impact ${formatImpactScore(item.impactScore)}`}
    >
      <div className="flex w-[110px] shrink-0 flex-col gap-[4px]">
        <div className="flex min-w-0 items-center gap-[8px]">
          <TeamFlag
            code={item.teamCode}
            name={item.teamName}
            className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <span className="truncate text-[16px] font-[457] leading-[19px] text-black">
            {item.teamName}
          </span>
        </div>
        <span className="whitespace-nowrap mt-[4px] text-[14px] font-[457] leading-[17px] text-[#909090]">
          {item.publishedAtLabel}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-[556] leading-[21px] text-black">
          {item.headline}
        </h3>
        <p className="m-0 mt-[8px] block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[457] leading-[17px] text-[#909090]">
          {item.summary}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-[4px]">
        <span className="shrink-0 [&_svg]:size-[18px]">
          <SentimentIcon sentiment={item.sentiment} />
        </span>
        <span
          className={cn(
            "whitespace-nowrap text-[18px] font-[556] leading-[21px]",
            isPositiveImpact ? "text-[#7BCA25]" : "text-[#FF674B]"
          )}
        >
          {formatImpactScore(item.impactScore)}
        </span>
      </div>
    </article>
  );
}
