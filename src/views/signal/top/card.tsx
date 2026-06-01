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
  onSelect?: (item: NewsImpactItem) => void;
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
        unoptimized
        className="size-[72px] shrink-0 rounded-[12px] object-cover md:size-[100px]"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-[72px] shrink-0 place-items-center rounded-[12px] md:size-[100px]",
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

export function SignalTopCard({ item, onSelect, className }: SignalTopCardProps) {
  const isPositiveImpact = item.impactScore >= 0;

  return (
    <article
      className={cn(
        "relative box-border flex h-auto min-h-[120px] w-full max-w-none items-start gap-3 p-3 md:h-[140px] md:max-w-[458px] md:items-center md:gap-[14px] md:p-[12px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white",
        onSelect && "cursor-pointer transition-colors hover:border-[#D8D8D8]",
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
      <SignalTopCardThumbnail
        alt={item.thumbnailAlt}
        imageUrl={item.thumbnailUrl}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 md:justify-start md:gap-[8px]">
          <div className="flex min-w-0 items-center gap-2 md:gap-[8px]">
            <TeamFlag
              code={item.teamCode}
              name={item.teamName}
              className="h-4 w-4 shrink-0 rounded-[4px] text-[16px] md:h-[20px] md:w-[20px] md:text-[20px]"
            />
            <span className="truncate text-base font-[556] leading-[19px] text-black md:text-[18px] md:leading-[21px]">
              {item.teamName}
            </span>
            <span className="shrink-0 [&_svg]:size-[18px]">
              <SentimentIcon sentiment={item.sentiment} />
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[12px] font-[457] leading-[14px] text-[#909090] md:hidden">
            {item.publishedAtLabel}
          </span>
        </div>

        <h3 className="m-0 mt-1 line-clamp-2 text-base font-[556] leading-[19px] text-black md:mt-[8px] md:line-clamp-1 md:text-[18px] md:leading-[21px]">
          {item.headline}
        </h3>

        <p className="m-0 mt-1 line-clamp-2 text-[14px] font-[457] leading-[17px] text-[#909090] md:mt-[6px]">
          {item.summary}
        </p>

        <div className="mt-2 flex items-baseline justify-between md:hidden">
          <span className="text-[12px] font-[457] leading-[14px] text-[#909090]">
            Impact
          </span>
          <span
            className={cn(
              "text-base font-[556] leading-[19px]",
              isPositiveImpact ? "text-[#7BCA25]" : "text-[#FF674B]"
            )}
          >
            {formatImpactScore(item.impactScore)}
          </span>
        </div>
      </div>

      <div className="hidden w-[52px] shrink-0 flex-col items-end pb-[18px] md:flex">
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
