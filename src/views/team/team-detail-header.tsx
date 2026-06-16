"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyLinkIcon } from "@/components/icons";
import { trackCopyLinkClicked } from "@/lib/analytics/tracking";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
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
import teamData from "@/data/teams";

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
            ? "block text-base font-[500] text-prophet-red"
            : tone === "up"
              ? "block text-base font-[500] text-prophet-green"
              : "block text-base font-[500] text-black"
        }
      >
        {value}
      </strong>
      <span className="mt-0.5 block text-[10px] font-[500] uppercase tracking-wide text-prophet-muted">
        {label}
      </span>
    </div>
  );
}

function getPageUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.href;
}

export function TeamDetailHeader({
  snapshot,
  detail
}: TeamDetailHeaderProps) {
  const t = useTranslations("teamDetail");
  const { team, market } = snapshot;
  const fifaRank = detail?.fifaRank;
  const displayName = useLocalizedTeamName(team.code, detail?.name || team.name);
  const logoUrl = detail?.logo;
  const bestFinish = detail?.bestFinish;
  const titles = detail?.titles;
  const marketValue = detail?.marketValue;

  const currentTeam = teamData[team.name as keyof typeof teamData];
  const teamSlug = (currentTeam as unknown as any)?.slug;

  const getGroupLabel = (groupName?: string): string => {
    if (!groupName) {
      return t("pending");
    }

    return groupName.startsWith("Group")
      ? groupName
      : t("groupLabel", { group: groupName });
  };

  return (
    <header className="md:my-4">
      <PageBack />

      <div className={teamHeroCardClass}>
        <div className="flex min-w-0 items-center gap-3">
          <TeamFlag
            name={displayName}
            logoUrl={logoUrl}
            className="h-[68px] w-[68px] shrink-0 rounded-lg text-[56px]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 truncate text-2xl font-[500] capitalize text-black sm:text-[32px]">
                {displayName}
              </h1>
              <span className="inline-flex h-[26px] items-center rounded-[14px] border border-[#909090] px-3 text-sm font-[500] text-[#909090]">
                {t("team")}
              </span>
            </div>
            <p className="m-0 mt-1 text-sm text-prophet-muted">
              {fifaRank
                ? t("fifaRanking", { rank: fifaRank })
                : t("fifaRankingPending")}
              {detail?.groupName
                ? ` / ${getGroupLabel(detail.groupName)}`
                : ` / ${t("groupPending")}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-prophet-line px-2 py-0.5 text-[11px] font-[500] text-prophet-muted">
                {bestFinish ?? t("worldCupHistoryPending")}
              </span>
              {!!titles && (
                <span className="rounded-full border border-[rgba(101,175,20,0.30)] px-4 py-0.5 text-[11px] font-[500] text-[#65AF14] bg-[rgba(101,175,20,0.30)]">
                  {t("titlesCount", { count: titles })}
                </span>
              )}
              <span className="rounded-full border border-prophet-line px-2 py-0.5 text-[11px] font-[500] text-prophet-muted">
                {t("curatedMetadata")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className={teamHeroMetricsClass}>
            <HeroMetric
              label={t("fifaRank")}
              value={fifaRank ? `#${fifaRank}` : t("pending")}
            />
            <HeroMetric
              label={t("squadValue")}
              value={
                marketValue
                  ? formatNumber(marketValue, 2, true, {
                      prefix: "€",
                      isShort: true,
                      isShortUppercase: true
                    })
                  : "-"
              }
            />
            <HeroMetric
              label={t("bestFinish")}
              value={bestFinish ?? t("pending")}
            />
            <HeroMetric
              label={t("group")}
              value={getGroupLabel(detail?.groupName)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
            {!!teamSlug && (
              <Link
                href={teamTradeHref(teamSlug)}
                className={teamOpenTradeButtonClass}
              >
                {t("openTrade")}
              </Link>
            )}
            <div className="flex items-center gap-2">
              <BookmarkControl
                slug={market.polymarket?.slug || ""}
                teamName={displayName ?? ""}
              />
              <CopyButton
                text={getPageUrl}
                ariaLabel={t("copyPageLink")}
                className="inline-flex size-9 items-center justify-center rounded-sm text-prophet-muted hover:text-black"
                onCopy={() =>
                  trackCopyLinkClicked({
                    target: "page_link",
                    label: "Copy page link",
                    entrySource: "team_detail_page"
                  })
                }
              >
                <CopyLinkIcon />
              </CopyButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
