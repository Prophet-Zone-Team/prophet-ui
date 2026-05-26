import Image from "next/image";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { formatImpactScore } from "@/views/analytics/news/format";
import {
  NegativeSentimentIcon,
  PositiveSentimentIcon
} from "@/views/analytics/news/icons";
import type { NewsImpactItem } from "@/views/analytics/news/types";

export type SignalTopCardProps = {
  item: NewsImpactItem;
  className?: string;
};

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SignalTopCardThumbnail({
  alt,
  imageUrl
}: {
  alt: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={100}
        height={100}
        className="size-[100px] shrink-0 rounded-[12px] object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-[100px] shrink-0 place-items-center rounded-[12px]",
        "bg-[linear-gradient(135deg,#E8ECF4_0%,#C5CEDE_100%)]",
        "text-[24px] font-[556] text-[#5A6478]"
      )}
      aria-label={alt}
    >
      {getInitials(alt)}
    </div>
  );
}

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

export function SignalTopCard({ item, className }: SignalTopCardProps) {
  const isPositiveImpact = item.impactScore >= 0;

  return (
    <article
      className={cn(
        "box-border flex h-[140px] w-[458px] items-center gap-[14px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white p-[12px]",
        className
      )}
      aria-label={`${item.teamName}: ${item.headline}. Impact ${formatImpactScore(item.impactScore)}`}
    >
      <SignalTopCardThumbnail
        alt={item.thumbnailAlt}
        imageUrl={item.thumbnailUrl}
      />

      <div className="flex-1">
        <div className="flex items-center gap-[8px]">
          <TeamFlag
            code={item.teamCode}
            name={item.teamName}
            className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <span className="truncate text-[18px] font-[556] leading-[21px] text-black">
            {item.teamName}
          </span>
          <span className="shrink-0 [&_svg]:size-[18px]">
            <SentimentIcon sentiment={item.sentiment} />
          </span>
        </div>

        <h3 className="m-0 mt-[8px] line-clamp-1 text-[18px] font-[556] leading-[21px] text-black">
          {item.headline}
        </h3>

        <p className="m-0 mt-[6px] line-clamp-2 text-[14px] font-[457] leading-[17px] text-[#909090]">
          {item.summary}
        </p>
      </div>

      <div className="flex w-[52px] shrink-0 flex-col items-end pb-[18px]">
        <span className="whitespace-nowrap text-[12px] font-[457] leading-[14px] text-[#909090]">
          {item.publishedAtLabel}
        </span>
        <span
          className={cn(
            "mt-[10px] text-[18px] font-[556] leading-[21px]",
            isPositiveImpact ? "text-[#7BCA25]" : "text-[#FF674B]"
          )}
        >
          {formatImpactScore(item.impactScore)}
        </span>
        <span className="mt-[8px] text-[12px] font-[457] leading-[14px] text-[#909090]">
          Impact
        </span>
      </div>
    </article>
  );
}
