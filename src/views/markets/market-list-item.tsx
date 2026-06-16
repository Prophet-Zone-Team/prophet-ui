"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import type { KeyboardEvent } from "react";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";

import { FastBidButton } from "@/components/trading/fast-bid-button";
import { TeamFlag } from "@/components/teams/team-flag";
import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import {
  trackDetailsClicked,
  trackTeamDetailClicked
} from "@/lib/analytics/tracking";
import { teamDetailHref } from "@/lib/routes/team";
import { teamTradeHref } from "@/lib/routes/trade";
import {
  formatListProbability,
  formatVolume
} from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketListMetricLoading } from "@/views/home/home-data-loading";
import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useLocalizedTeamRegion } from "@/hooks/i18n/use-localized-team-region";
import { MarketBookmarkControl } from "@/views/home/winner/market-bookmark-control";

export interface MarketListItemProps {
  snapshot: TeamMarketSnapshot;
  rank: number;
  hasLiveValues?: boolean;
  isLoading?: boolean;
  /** When true, row does not navigate and has no hover affordance. */
  navigationDisabled?: boolean;
}

const rowLabelClassName = "text-[12px] font-[400] text-[#909090]";

const bidButtonClassName =
  "inline-flex h-[36px] min-w-[96px] items-center justify-center gap-1 rounded-lg bg-[#18110F] px-2 text-[14px] font-[500] leading-[17px] text-white disabled:cursor-wait disabled:opacity-70";

function MarketListMobileProbability({
  probability,
  changePercent,
  hasLiveValues,
  isLoading
}: {
  probability: number;
  changePercent: number;
  hasLiveValues: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <MarketListMetricLoading variant="probability" />;
  }

  const probabilityLabel = hasLiveValues
    ? formatListProbability(probability)
    : "-";
  const fillPercent = hasLiveValues
    ? Math.min(100, Math.max(0, probability))
    : 0;

  return (
    <div className="flex shrink-0 items-end gap-2">
      {hasLiveValues && !!changePercent ? (
        <ProbabilityChangeTrend
          changePercent={changePercent}
          decimals={1}
          className="[&_span]:leading-[18px] [&_svg]:size-[13px]"
        />
      ) : null}
      <div className="flex w-[94px] flex-col items-end gap-[10px] pb-[4px]">
        <span className="text-right text-[18px] font-[500] leading-[23px] text-black">
          {probabilityLabel}
        </span>
        {hasLiveValues ? (
          <div
            className="h-[8px] w-[94px] overflow-hidden rounded-[4px] bg-[#D9D9D9]"
            role="presentation"
          >
            <div
              className="h-full rounded-[4px] bg-black"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MarketListItem({
  snapshot,
  rank,
  hasLiveValues = true,
  isLoading = false,
  navigationDisabled = false
}: MarketListItemProps) {
  const router = useRouter();
  const t = useTranslations("home");
  const { team, market } = snapshot;
  const teamDisplayName = useLocalizedTeamName(team.code, team.name);
  const teamRegionLabel = useLocalizedTeamRegion(team.region);
  const yesTokenId = snapshot.market.polymarket?.tokens?.yes?.tokenId;
  const changePercent = market.change24h;

  const tradeHref = teamTradeHref(market?.polymarket?.slug || "");
  const detailHref = teamDetailHref(team.id);
  const subtitle = `${team.code} / ${teamRegionLabel}${team.group ? ` / Group ${team.group}` : ""}`;
  const canNavigate =
    !navigationDisabled &&
    Boolean(yesTokenId) &&
    snapshot.market.polymarket?.acceptingOrders !== false;
  const impressionRef = useAnalyticsImpression<HTMLElement>({
    eventName: "team_card_impressed",
    dedupeKey: `team_list:${team.id}`,
    payload: {
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      itemPosition: rank,
      listName: "team_list"
    }
  });

  function navigateToTrade() {
    if (!canNavigate) {
      return;
    }

    trackTeamDetailClicked({
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      entrySource: "home_team_list",
      itemPosition: rank,
      listName: "team_list"
    });

    router.push(tradeHref);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!canNavigate) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToTrade();
    }
  }

  return (
    <article
      ref={impressionRef}
      role={canNavigate ? "link" : undefined}
      tabIndex={canNavigate ? 0 : undefined}
      aria-label={
        canNavigate
          ? `Open trade page for ${teamDisplayName}`
          : `${teamDisplayName}, market ended`
      }
      onClick={canNavigate ? navigateToTrade : undefined}
      onKeyDown={canNavigate ? handleRowKeyDown : undefined}
      className={cn(
        "flex md:min-h-[78px] items-center gap-x-10 gap-y-3 overflow-visible rounded-xl border border-[#EBEBEB] px-4",
        canNavigate
          ? "cursor-pointer transition-colors hover:border-[#d0d0d0]"
          : "cursor-default opacity-90",
        "max-lg:flex-col max-lg:items-stretch max-lg:gap-4 max-lg:py-3"
      )}
      style={{
        background:
          changePercent >= 0
            ? "linear-gradient(90deg, rgba(220, 255, 181, 0.20) 0%, rgba(255, 255, 255, 0.20) 38.67%), #FFF"
            : "linear-gradient(90deg, rgba(255, 181, 181, 0.20) 0%, rgba(255, 255, 255, 0.20) 38.67%), #FFF"
      }}
    >
      <div className="flex w-full items-center gap-[20px] max-lg:justify-between max-lg:gap-3 lg:w-2/5">
        <div className="flex min-w-0 items-center gap-[20px]">
          <div className="hidden shrink-0 lg:block">
            <MarketBookmarkControl
              slug={market.polymarket?.slug || ""}
              teamName={teamDisplayName}
            />
          </div>
          <span className="hidden w-[18px] shrink-0 text-center text-[18px] font-[500] leading-[21px] text-black lg:inline">
            {rank}
          </span>
          <TeamFlag
            code={team.code}
            name={teamDisplayName}
            logoUrl={team.logoUrl}
            className="h-[32px] w-[32px] shrink-0 rounded-[2px] text-[32px]"
          />
          <div className="min-w-0">
            <h3 className="m-0 text-[18px] font-[500] leading-[21px] text-black">
              {teamDisplayName}
            </h3>
            <p className={cn("m-0 mt-0.5", rowLabelClassName)}>{subtitle}</p>
          </div>
        </div>
        <div className="lg:hidden">
          <MarketListMobileProbability
            probability={market.probability}
            changePercent={changePercent}
            hasLiveValues={hasLiveValues}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="hidden w-full items-center gap-x-10 lg:flex lg:w-2/5">
        <div className="flex w-1/2 flex-col">
          <div className="flex items-center gap-[8px]">
            {isLoading ? (
              <MarketListMetricLoading variant="probability" />
            ) : (
              <span className="text-[24px] font-[500] leading-[29px] text-black">
                {hasLiveValues
                  ? formatListProbability(market.probability)
                  : "-"}
              </span>
            )}
            {hasLiveValues && !!changePercent ? (
              <ProbabilityChangeTrend
                changePercent={changePercent}
                decimals={1}
              />
            ) : null}
          </div>
          <span className={cn("mt-0.5", rowLabelClassName)}>
            {t("probability")}
          </span>
        </div>

        <div className="flex w-1/2 flex-col">
          {isLoading ? (
            <MarketListMetricLoading variant="volume" />
          ) : (
            <strong className="text-lg font-[500] leading-[21px] text-black">
              {hasLiveValues ? `$${formatVolume(market.volume)}` : "-"}
            </strong>
          )}
          <span className={cn("mt-0.5", rowLabelClassName)}>{t("volume")}</span>
        </div>
      </div>

      <div
        className="ml-auto hidden w-full items-center gap-2 md:w-1/5 lg:flex lg:justify-start"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <FastBidButton
          snapshot={snapshot}
          className={cn(bidButtonClassName, "flex-1 md:flex-grow-0")}
          disabled={isLoading || !hasLiveValues || !yesTokenId}
        >
          <>
            <Zap
              className="h-3.5 w-2.5 shrink-0 fill-white stroke-white"
              aria-hidden="true"
            />
            {t("bid")}
          </>
        </FastBidButton>
        <Link
          className="flex-1 md:shrink-0 px-2 inline-flex h-[36px] w-[83px] items-center justify-center rounded-lg border border-[#909090] bg-white text-[14px] font-[500] leading-[17px] text-[#18110F]"
          href={detailHref}
          onClick={() =>
            trackDetailsClicked({
              teamId: team.id,
              teamName: team.name,
              teamCode: team.code,
              entrySource: "home_team_list",
              itemPosition: rank,
              listName: "team_list",
              target: "team_detail"
            })
          }
        >
          {t("details")}
        </Link>
      </div>
    </article>
  );
}
