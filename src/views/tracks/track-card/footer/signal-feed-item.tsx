import Image from "next/image";

import { cn } from "@/lib/cn";
import {
  NegativeSentimentIcon,
  PositiveSentimentIcon
} from "@/views/analytics/news/icons";

import type { TrackCardSentiment, TrackCardSignalItem } from "../types";

export type SignalFeedItemProps = {
  item: TrackCardSignalItem;
  className?: string;
  truncateHeadline?: boolean;
};

function getThumbnailInitials(value: string): string {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SignalThumbnail({
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
        width={30}
        height={30}
        className="size-[30px] shrink-0 rounded-[6px] object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-[30px] shrink-0 place-items-center rounded-[6px]",
        "bg-[linear-gradient(135deg,#E8ECF4_0%,#C5CEDE_100%)]",
        "text-[10px] font-[500] text-[#5A6478]"
      )}
      aria-hidden
    >
      {getThumbnailInitials(alt)}
    </div>
  );
}

function SentimentIcon({ sentiment }: { sentiment: TrackCardSentiment }) {
  if (sentiment === "negative") {
    return <NegativeSentimentIcon />;
  }

  return <PositiveSentimentIcon />;
}

export function SignalFeedItem({
  item,
  className,
  truncateHeadline = true
}: SignalFeedItemProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2",
        truncateHeadline ? "min-w-[280px] max-w-[483px]" : "min-w-max",
        className
      )}
    >
      <SignalThumbnail alt={item.thumbnailAlt} imageUrl={item.thumbnailUrl} />
      <span className="shrink-0 [&_svg]:size-[18px]">
        <SentimentIcon sentiment={item.sentiment} />
      </span>
      <p
        className={cn(
          "m-0 whitespace-nowrap text-[16px] font-[400] leading-[20px] text-[#909090]",
          truncateHeadline && "min-w-0 truncate"
        )}
      >
        {item.headline}
      </p>
    </div>
  );
}
