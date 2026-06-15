"use client";

import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyLinkIcon } from "@/components/icons";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { BookmarkControl } from "@/views/trade/team/bookmark-control";

export interface GroupDetailHeaderProps {
  title: string;
  dateRange: string;
  volume: number;
  slug: string;
  group?: WorldCup2026Group;
}

function getPageUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.href;
}
function formatGroupVolume(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function GroupDetailHeader({
  title,
  dateRange,
  volume,
  slug,
  group = "A"
}: GroupDetailHeaderProps) {
  const t = useTranslations("trade");

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={`/group/${group.toLowerCase()}.webp`}
          alt={title}
          width={68}
          height={68}
          className="size-[68px] shrink-0 rounded-lg object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />

        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-[36px] font-[500] leading-[45px] text-black">
            {title}
          </h1>

          <p className="m-0 mt-1 text-sm leading-[18px]">
            <span className="text-[#909090]">{dateRange}</span>
            <span className="text-[#909090]"> | {t("volumeLabel")} </span>
            <span className="font-[500] text-black">
              {formatGroupVolume(volume)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <BookmarkControl slug={slug} teamName={title} />

        <CopyButton
          text={getPageUrl}
          ariaLabel={t("copyPageLink")}
          className="inline-flex size-11 items-center justify-center rounded-sm text-[#909090] transition-colors hover:text-black"
        >
          <CopyLinkIcon />
        </CopyButton>
      </div>
    </header>
  );
}
