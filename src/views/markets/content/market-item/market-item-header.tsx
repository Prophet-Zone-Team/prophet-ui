"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";
import { ExpandToggle } from "@/views/markets/content/market-item/expand-toggle";
import { LiveIndicator } from "@/views/markets/content/market-item/live-indicator";
import type { MarketItemTeam } from "@/views/markets/content/market-item/types";

export function MarketItemHeader({
  matchId,
  kickoffLabel,
  isLive,
  homeTeam,
  awayTeam,
  expanded,
  totalCount,
  onToggleExpanded,
  centerContent
}: {
  matchId?: string;
  kickoffLabel: string;
  isLive?: boolean;
  homeTeam: MarketItemTeam;
  awayTeam: MarketItemTeam;
  expanded: boolean;
  totalCount: number;
  onToggleExpanded: () => void;
  centerContent?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 pt-4",
        expanded && "border-b border-[#EBEBEB] pb-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {matchId ? (
            <MatchBookmarkControl
              matchId={matchId}
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
            />
          ) : null}
          {isLive ? <LiveIndicator dotOnly /> : null}
          <span
            className={cn(
              "text-[14px] font-[400] leading-[18px]",
              isLive ? "text-[#7BCA25]" : "text-[#909090]"
            )}
          >
            {kickoffLabel}
          </span>
        </div>
        <ExpandToggle
          expanded={expanded}
          totalCount={totalCount}
          onToggle={onToggleExpanded}
        />
      </div>

      {centerContent ? (
        <div className="flex justify-center">{centerContent}</div>
      ) : null}
    </div>
  );
}
