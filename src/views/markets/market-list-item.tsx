"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import type { KeyboardEvent } from "react";

import { FastBidButton } from "@/components/trading/fast-bid-button";
import { TeamFlag } from "@/components/teams/team-flag";
import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import { teamDetailHref } from "@/lib/routes/team";
import { teamTradeHref } from "@/lib/routes/trade";
import {
  formatListProbability,
  formatVolume,
  getRelativeChangePercent
} from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketListMetricLoading } from "@/views/home/home-data-loading";
import { MarketBookmarkControl } from "@/views/home/winner/market-bookmark-control";

export interface MarketListItemProps {
  snapshot: TeamMarketSnapshot;
  rank: number;
  hasLiveValues?: boolean;
  isLoading?: boolean;
  /** When true, row does not navigate and has no hover affordance. */
  navigationDisabled?: boolean;
}

const rowLabelClassName = "text-[12px] font-[457] text-[#909090]";

const bidButtonClassName =
  "inline-flex h-[36px] min-w-[96px] items-center justify-center gap-1 rounded-lg bg-[#18110F] px-2 text-[14px] font-[556] leading-[17px] text-white disabled:cursor-wait disabled:opacity-70";

export function MarketListItem({
  snapshot,
  rank,
  hasLiveValues = true,
  isLoading = false,
  navigationDisabled = false
}: MarketListItemProps) {
  const router = useRouter();
  const { team, market } = snapshot;
  const yesTokenId = snapshot.market.polymarket?.tokens?.yes?.tokenId;
  const changePercent = getRelativeChangePercent(
    market.probability,
    market.change24h
  );

  const tradeHref = teamTradeHref(market?.polymarket?.slug || "");
  const detailHref = teamDetailHref(team.id);
  const subtitle = `${team.code} / ${team.region}${team.group ? ` / Group ${team.group}` : ""}`;
  const canNavigate =
    !navigationDisabled &&
    Boolean(yesTokenId) &&
    snapshot.market.polymarket?.acceptingOrders !== false;

  function navigateToTrade() {
    if (!canNavigate) {
      return;
    }

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
      role={canNavigate ? "link" : undefined}
      tabIndex={canNavigate ? 0 : undefined}
      aria-label={
        canNavigate
          ? `Open trade page for ${team.name}`
          : `${team.name}, market ended`
      }
      onClick={canNavigate ? navigateToTrade : undefined}
      onKeyDown={canNavigate ? handleRowKeyDown : undefined}
      className={cn(
        "flex min-h-[78px] items-center gap-x-10 gap-y-3 overflow-visible rounded-xl border border-[#EBEBEB] px-4",
        canNavigate
          ? "cursor-pointer transition-colors hover:border-[#d0d0d0]"
          : "cursor-default opacity-90",
        "max-lg:flex-col max-lg:items-stretch max-lg:gap-4 max-lg:py-3"
      )}
      style={{
        background:
          changePercent < 0
            ? "linear-gradient(90deg, rgba(220, 255, 181, 0.20) 0%, rgba(255, 255, 255, 0.20) 38.67%), #FFF"
            : "linear-gradient(90deg, rgba(255, 181, 181, 0.20) 0%, rgba(255, 255, 255, 0.20) 38.67%), #FFF"
      }}
    >
      <div className="flex w-full md:w-2/5 items-center gap-[20px]">
        <MarketBookmarkControl
          slug={market.polymarket?.slug || ""}
          teamName={team.name}
        />
        <span className="w-[18px] shrink-0 text-center text-[18px] font-[556] leading-[21px] text-black">
          {rank}
        </span>
        <TeamFlag
          code={team.code}
          name={team.name}
          logoUrl={team.logoUrl}
          className="h-[32px] w-[32px] shrink-0 rounded-[2px] text-[32px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        <div className="min-w-0">
          <h3 className="m-0 text-[18px] font-[556] leading-[21px] text-black">
            {team.name}
          </h3>
          <p className={cn("m-0 mt-0.5", rowLabelClassName)}>{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-x-10 w-full md:w-2/5">
        <div className="flex w-1/2 flex-col max-lg:w-full">
          <div className="flex items-center gap-[8px]">
            {isLoading ? (
              <MarketListMetricLoading variant="probability" />
            ) : (
              <span className="text-[24px] font-[556] leading-[29px] text-black">
                {hasLiveValues
                  ? formatListProbability(market.probability)
                  : "-"}
              </span>
            )}
            {hasLiveValues ? (
              <ProbabilityChangeTrend
                changePercent={changePercent}
                decimals={1}
              />
            ) : null}
          </div>
          <span className={cn("mt-0.5", rowLabelClassName)}>Probability</span>
        </div>

        <div className="flex w-1/2 flex-col max-lg:w-full">
          {isLoading ? (
            <MarketListMetricLoading variant="volume" />
          ) : (
            <strong className="text-lg font-[556] leading-[21px] text-black">
              {hasLiveValues ? `$${formatVolume(market.volume)}` : "-"}
            </strong>
          )}
          <span className={cn("mt-0.5", rowLabelClassName)}>Volume</span>
        </div>
      </div>

      <div
        className="ml-auto flex w-full md:w-1/5 items-center gap-2 justify-between md:justify-start"
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
            Bid
          </>
        </FastBidButton>
        <Link
          className="flex-1 md:flex-grow-0 px-2 inline-flex h-[36px] w-[83px] items-center justify-center rounded-lg border border-[#909090] bg-white text-[14px] font-[556] leading-[17px] text-[#18110F]"
          href={detailHref}
        >
          Details
        </Link>
      </div>
    </article>
  );
}
