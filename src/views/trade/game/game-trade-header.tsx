"use client";

import Link from "next/link";

import { BackChevronIcon, CopyLinkIcon } from "@/components/icons";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { formatMatchScore } from "@/lib/market/match-display";
import {
  formatScheduleKickoff,
  getScheduleRowVariant,
  resolveMatchSides
} from "@/lib/market/schedule-match";
import { useLiveElapsedClock } from "@/lib/market/use-live-elapsed-clock";
import type {
  GameMarketSnapshot,
  TeamMarketSnapshot
} from "@/types/market";

export interface GameTradeHeaderProps {
  snapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  showOrderbook: boolean;
  onOrderbookChange: (value: boolean) => void;
}

export function GameTradeHeader({
  snapshot,
  teamSnapshots,
  showOrderbook,
  onOrderbookChange
}: GameTradeHeaderProps) {
  const { match } = snapshot;
  const sides = resolveMatchSides(match, teamSnapshots);
  const statusVariant = getScheduleRowVariant(match.status);
  const scoreLabel = formatMatchScore(match.homeScore, match.awayScore);
  const liveClock = useLiveElapsedClock(
    match.liveElapsedSeconds,
    match.status === "live"
  );
  const stageLabel = match.group
    ? `Group ${match.group}`
    : match.stage.replace("_", " ");

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/matches"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-[556] leading-[17px] text-black hover:opacity-80"
          >
            <BackChevronIcon />
            back
          </Link>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-[26px] items-center rounded-[14px] border border-[#909090] px-3 text-sm font-[556] text-[#909090]">
              Trade
            </span>
            <span
              className={cn(
                "inline-flex h-[26px] items-center rounded-[14px] px-3 text-sm font-[556] capitalize",
                statusVariant === "ongoing"
                  ? "bg-[#7BCA25]/10 text-[#7BCA25]"
                  : statusVariant === "ended"
                    ? "bg-[#909090]/10 text-[#909090]"
                    : "bg-[#9B7BFF]/10 text-[#9B7BFF]"
              )}
            >
              {statusVariant}
            </span>
            <span className="text-sm font-[556] text-[#909090]">{stageLabel}</span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <MatchTeamColumn
              name={sides.home.name}
              code={sides.home.code}
              align="start"
            />
            <div className="text-center">
              <p className="m-0 text-[36px] font-[556] leading-[43px] text-black">
                {scoreLabel}
              </p>
              <p className="m-0 mt-1 text-sm font-[556] text-[#909090]">
                {match.status === "live" && liveClock
                  ? liveClock
                  : formatScheduleKickoff(match.kickoffAt)}
              </p>
            </div>
            <MatchTeamColumn
              name={sides.away.name}
              code={sides.away.code}
              align="end"
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-sm text-[#909090] transition-colors hover:text-black"
            aria-label="Copy page link"
            onClick={() => void copyPageLink()}
          >
            <CopyLinkIcon />
          </button>

          <label className="flex cursor-pointer items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={showOrderbook}
              aria-label="Show orderbook"
              onClick={() => onOrderbookChange(!showOrderbook)}
              className={cn(
                "relative h-4 w-[29px] shrink-0 rounded-lg border border-[#EAEAEA] transition-colors",
                showOrderbook ? "bg-[#F4B600]" : "bg-[#EBEBEB]"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 size-3 -translate-y-1/2 rounded-lg border border-[#EAEAEA] bg-white transition-[left]",
                  showOrderbook ? "left-[calc(100%-14px)]" : "left-0.5"
                )}
                aria-hidden
              />
            </button>
            <span className="whitespace-nowrap text-base font-[457] leading-[19px] text-[#909090]">
              Orderbook
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}

function MatchTeamColumn({
  name,
  code,
  align
}: {
  name: string;
  code?: string;
  align: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "end" && "flex-row-reverse text-right"
      )}
    >
      <TeamFlag
        code={code}
        name={name}
        className="h-[68px] w-[68px] shrink-0 rounded-lg text-[56px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="min-w-0">
        <h1 className="m-0 truncate text-xl font-[556] capitalize leading-6 text-black sm:text-2xl">
          {name}
        </h1>
      </div>
    </div>
  );
}
