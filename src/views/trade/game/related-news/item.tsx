import Image from "next/image";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import type { RelatedNewsItem } from "./types";

export type RelatedNewsRowProps = {
  item: RelatedNewsItem;
  onSelect?: (item: RelatedNewsItem) => void;
  className?: string;
};

function getThumbnailInitials(value: string): string {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function RelatedNewsThumbnail({
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
        width={72}
        height={72}
        className="size-[72px] shrink-0 rounded-[12px] object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-[72px] shrink-0 place-items-center rounded-[12px]",
        "bg-[linear-gradient(135deg,#E8ECF4_0%,#C5CEDE_100%)]",
        "text-[18px] font-[556] text-[#5A6478]"
      )}
      aria-label={alt}
    >
      {getThumbnailInitials(alt)}
    </div>
  );
}

export function RelatedNewsRow({
  item,
  onSelect,
  className
}: RelatedNewsRowProps) {
  return (
    <article
      className={cn(
        "relative flex w-full items-center gap-[12px] rounded-[12px] px-[12px] py-[12px]",
        item.highlighted && "bg-[#F9FAFC]",
        onSelect && "cursor-pointer duration-150 hover:bg-[#EDEDED]",
        className
      )}
      aria-label={`${item.teamName}: ${item.headline}`}
    >
      {onSelect ? (
        <button
          type="button"
          className="absolute inset-0 z-[1] rounded-[12px] opacity-0"
          aria-label={`Open details for ${item.headline}`}
          onClick={() => onSelect(item)}
        />
      ) : null}
      <RelatedNewsThumbnail
        alt={item.thumbnailAlt}
        imageUrl={item.thumbnailUrl}
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-[8px]">
          <TeamFlag
            code={item.teamCode}
            name={item.teamName}
            className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <span className="truncate text-[14px] font-[500] leading-[21px] text-black">
            {item.teamName}
          </span>
        </div>
        <h3 className="m-0 mt-[8px] line-clamp-2 text-[14px] font-[500] leading-[19px] text-black">
          {item.headline}
        </h3>
      </div>
    </article>
  );
}
