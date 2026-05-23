"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { teamDetailHref } from "@/lib/routes/team";
import { teamTradeHref } from "@/lib/routes/trade";
import {
  formatProbability,
  formatVolume,
  getRelativeChangePercent
} from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketBookmarkControl } from "@/views/home/winner/market-bookmark-control";
import { MarketBidDialog } from "@/views/markets/market-bid-dialog";

export interface MarketListItemProps {
  snapshot: TeamMarketSnapshot;
  rank: number;
}

const rowLabelClassName = "text-xs font-normal leading-[14px] text-[#909090]";

const rowBackgroundClassName =
  "bg-[linear-gradient(90deg,rgba(220,255,181,0.2)_0%,rgba(255,255,255,0.2)_38.67%),#FFF]";

const bidButtonClassName =
  "inline-flex h-9 w-[83px] items-center justify-center gap-1 rounded-lg bg-[#18110F] text-sm font-[556] leading-[17px] text-white";

export function MarketListItem({ snapshot, rank }: MarketListItemProps) {
  const router = useRouter();
  const [bidOpen, setBidOpen] = useState(false);
  const { team, market } = snapshot;
  const isDown = market.change24h < 0;
  const changePercent = getRelativeChangePercent(
    market.probability,
    market.change24h
  );
  const trendColor = isDown ? "text-[#D64545]" : "text-[#65AF14]";
  const detailHref = teamDetailHref(team.id);
  const tradeHref = teamTradeHref(team.id);

  function navigateToTrade() {
    router.push(tradeHref);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToTrade();
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open trade page for ${team.name}`}
      onClick={navigateToTrade}
      onKeyDown={handleRowKeyDown}
      className={cn(
        "flex min-h-[78px] cursor-pointer items-center gap-x-10 gap-y-3 overflow-visible rounded-xl border border-[#EBEBEB] px-4 transition-colors hover:border-[#d0d0d0]",
        "max-lg:flex-col max-lg:items-stretch max-lg:gap-4 max-lg:py-3",
        rowBackgroundClassName
      )}
    >
      <div className="flex w-2/5 items-center gap-3 max-lg:flex-none">
        <MarketBookmarkControl teamId={team.id} />
        <span className="w-[18px] shrink-0 text-center text-lg font-[556] leading-[21px] text-black">
          {rank}
        </span>
        <TeamFlag
          code={team.code}
          name={team.name}
          className="h-8 w-8 shrink-0 rounded-[2px] text-[32px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        <div className="min-w-0">
          <h3 className="m-0 text-lg font-[556] leading-[21px] text-black">
            {team.name}
          </h3>
          <p className={cn("m-0 mt-0.5", rowLabelClassName)}>
            {team.code} / {team.region}
            {team.group ? ` / Group ${team.group}` : ""}
          </p>
        </div>
      </div>

      <div className="flex w-1/5 flex-col max-lg:w-full">
        <div className="flex items-center gap-1.5">
          <strong className="text-2xl font-[556] leading-[29px] text-black">
            {formatProbability(market.probability)}
          </strong>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-[556] leading-[17px]",
              trendColor
            )}
          >
            <MarketTrendArrow isDown={isDown} />
            {formatChangeMagnitude(changePercent)}
          </span>
        </div>
        <span className={cn("mt-0.5", rowLabelClassName)}>Probability</span>
      </div>

      <div className="flex w-1/5 flex-col max-lg:w-full">
        <strong className="text-lg font-[556] leading-[21px] text-black">
          ${formatVolume(market.volume)}
        </strong>
        <span className={cn("mt-0.5", rowLabelClassName)}>Volume</span>
      </div>

      <div
        className="ml-auto flex w-1/5 items-center gap-2 max-lg:ml-0 max-lg:w-full max-lg:justify-end"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={bidButtonClassName}
          aria-label={`Bid on ${team.name}`}
          onClick={() => setBidOpen(true)}
        >
          <Zap
            className="h-3.5 w-2.5 shrink-0 fill-white stroke-white"
            aria-hidden="true"
          />
          Bid
        </button>
        <Link
          className="inline-flex h-9 w-[83px] items-center justify-center rounded-lg border border-[#909090] bg-white text-sm font-[556] leading-[17px] text-[#18110F]"
          href={detailHref}
        >
          Details
        </Link>
      </div>

      <MarketBidDialog
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        snapshot={snapshot}
      />
    </article>
  );
}

function MarketTrendArrow({ isDown }: { isDown: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-[13px] w-[13px] shrink-0 rounded-[1px] bg-current",
        isDown && "rotate-180"
      )}
      style={{
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
      }}
    />
  );
}

function formatChangeMagnitude(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`;
}
