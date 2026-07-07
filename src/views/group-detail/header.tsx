"use client";

import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyLinkIcon } from "@/components/icons";
import { PageBack } from "@/components/ui/page-back";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { trackCopyLinkClicked } from "@/lib/analytics/tracking";

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

function HeaderActionButtons({ slug, title }: { slug: string; title: string }) {
  const t = useTranslations("trade");

  return (
    <div className="flex shrink-0 items-center gap-2 md:gap-3">
      <CopyButton
        text={getPageUrl}
        ariaLabel={t("copyPageLink")}
        className="inline-flex size-9 items-center justify-center rounded-sm text-prophet-muted transition-colors hover:text-prophet-foreground md:size-11 md:text-prophet-muted"
        onCopy={() =>
          trackCopyLinkClicked({
            target: "page_link",
            label: "Copy page link",
            entrySource: "group_detail_page"
          })
        }
      >
        <CopyLinkIcon className="size-4 md:size-5" />
      </CopyButton>
    </div>
  );
}

function GroupIdentity({
  title,
  dateRange,
  volume,
  group
}: {
  title: string;
  dateRange: string;
  volume: number;
  group: WorldCup2026Group;
}) {
  const t = useTranslations("trade");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={`/group/${group.toLowerCase()}.webp`}
        alt={title}
        width={68}
        height={68}
        className="size-[68px] shrink-0 rounded-lg object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />

      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate text-[20px] font-[500] leading-[30px] text-prophet-foreground md:text-[36px] md:leading-[45px]">
          {title}
        </h1>

        <p className="m-0 mt-1 text-sm leading-[18px]">
          <span className="block md:inline">
            <span className="text-prophet-muted md:hidden">{t("timeLabel")} </span>
            <span className="font-[500] text-prophet-foreground md:font-normal md:text-prophet-muted">
              {dateRange}
            </span>
          </span>
          <span className="block md:inline">
            <span className="hidden text-prophet-muted md:inline"> | </span>
            <span className="text-prophet-muted">{t("volumeLabel")} </span>
            <span className="font-[500] text-prophet-foreground">
              {formatGroupVolume(volume)}
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}

export function GroupDetailHeader({
  title,
  dateRange,
  volume,
  slug,
  group = "A"
}: GroupDetailHeaderProps) {
  return (
    <header className="md:my-4">
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center justify-between">
          <PageBack className="mb-0" />
          <HeaderActionButtons slug={slug} title={title} />
        </div>

        <GroupIdentity
          title={title}
          dateRange={dateRange}
          volume={volume}
          group={group}
        />
      </div>

      <div className="hidden md:block">
        <PageBack />

        <div className="flex items-center justify-between gap-4">
          <GroupIdentity
            title={title}
            dateRange={dateRange}
            volume={volume}
            group={group}
          />

          <HeaderActionButtons slug={slug} title={title} />
        </div>
      </div>
    </header>
  );
}
