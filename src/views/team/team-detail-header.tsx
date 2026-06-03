"use client";

import Link from "next/link";

import { CopyLinkIcon } from "@/components/icons";
import { TeamFlag } from "@/components/teams/team-flag";
import { teamTradeHref } from "@/lib/routes/trade";
import type { TeamDetailHeaderData } from "@/lib/team/map-team-detail";
import type { TeamMarketSnapshot } from "@/types/market";
import { BookmarkControl } from "@/views/trade/team/bookmark-control";
import {
  teamHeroCardClass,
  teamHeroMetricsClass,
  teamOpenTradeButtonClass
} from "@/views/team/team-detail-ui";
import { PageBack } from "@/components/ui/page-back";
import { formatNumber } from "@/utils";

export interface TeamDetailHeaderProps {
  snapshot: TeamMarketSnapshot;
  detail?: TeamDetailHeaderData;
}

function HeroMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-prophet-line/80 bg-white/80 px-3 py-2.5 text-center sm:text-left">
      <strong
        className={
          tone === "down"
            ? "block text-base font-[556] text-prophet-red"
            : tone === "up"
              ? "block text-base font-[556] text-prophet-green"
              : "block text-base font-[556] text-black"
        }
      >
        {value}
      </strong>
      <span className="mt-0.5 block text-[10px] font-[556] uppercase tracking-wide text-prophet-muted">
        {label}
      </span>
    </div>
  );
}

function getGroupLabel(groupName?: string): string {
  if (!groupName) {
    return "Pending";
  }

  return groupName.startsWith("Group") ? groupName : `Group ${groupName}`;
}

export function TeamDetailHeader({
  snapshot,
  detail
}: TeamDetailHeaderProps) {
  const { team, market } = snapshot;
  const fifaRank = detail?.fifaRank ?? team.fifaRank;
  const displayName = detail?.name ?? team.name;
  const logoUrl = detail?.logo;
  const bestFinish = detail?.bestFinish;
  const titles = detail?.titles;
  const marketValue = detail?.marketValue;

  async function copyPageLink() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <header className="my-4">
      <PageBack />

      <div className={teamHeroCardClass}>
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-[68px] w-[68px] shrink-0 rounded-lg object-contain"
            />
          ) : (
            <TeamFlag
              code={team.code}
              name={displayName}
              className="h-[68px] w-[68px] shrink-0 rounded-lg text-[56px]"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 truncate text-2xl font-[556] capitalize text-black sm:text-[32px]">
                {displayName}
              </h1>
              <span className="inline-flex h-[26px] items-center rounded-[14px] border border-[#909090] px-3 text-sm font-[556] text-[#909090]">
                Team
              </span>
            </div>
            <p className="m-0 mt-1 text-sm text-prophet-muted">
              {fifaRank ? `FIFA Ranking #${fifaRank}` : "FIFA ranking pending"}
              {detail?.groupName
                ? ` / ${getGroupLabel(detail.groupName)}`
                : " / Group pending"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-prophet-line px-2 py-0.5 text-[11px] font-[556] text-prophet-muted">
                {bestFinish ?? "World Cup history pending"}
              </span>
              {!!titles && (
                <span className="rounded-full border border-[rgba(101,175,20,0.30)] px-4 py-0.5 text-[11px] font-[556] text-[#65AF14] bg-[rgba(101,175,20,0.30)]">
                  {titles} titles
                </span>
              )}
              <span className="rounded-full border border-prophet-line px-2 py-0.5 text-[11px] font-[556] text-prophet-muted">
                curated metadata
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className={teamHeroMetricsClass}>
            <HeroMetric
              label="FIFA rank"
              value={fifaRank ? `#${fifaRank}` : "Pending"}
            />
            <HeroMetric label="Squad value" value={marketValue ? formatNumber(marketValue, 2, true, { prefix: "€", isShort: true, isShortUppercase: true }) : "-"} />
            <HeroMetric label="Best finish" value={bestFinish ?? "Pending"} />
            <HeroMetric
              label="Group"
              value={getGroupLabel(detail?.groupName)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
            <Link
              href={teamTradeHref(team.id)}
              className={teamOpenTradeButtonClass}
            >
              Open Trade
            </Link>
            <div className="flex items-center gap-2">
              <BookmarkControl
                slug={market.polymarket?.slug || ""}
                teamName={displayName}
              />
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-sm text-prophet-muted hover:text-black"
                aria-label="Copy page link"
                onClick={() => void copyPageLink()}
              >
                <CopyLinkIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
