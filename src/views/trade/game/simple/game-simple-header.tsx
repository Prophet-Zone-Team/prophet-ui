"use client";

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
import { gameSimpleColors } from "@/views/trade/game/simple/game-simple-ui";

export interface GameSimpleHeaderProps {
  snapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

export function GameSimpleHeader({
  snapshot,
  teamSnapshots
}: GameSimpleHeaderProps) {
  const { match } = snapshot;
  const sides = resolveMatchSides(match, teamSnapshots);
  const statusVariant = getScheduleRowVariant(match.status);
  const scoreLabel = formatMatchScore(match.homeScore, match.awayScore);
  const kickoffLabel = formatScheduleKickoff(match.kickoffAt);
  const liveClock = useLiveElapsedClock(
    match.liveElapsedSeconds,
    match.status === "live"
  );

  const statusLabel =
    statusVariant === "ongoing"
      ? liveClock ?? "ongoing"
      : statusVariant === "ended"
        ? "ended"
        : "upcoming";

  return (
    <header
      className="w-full bg-black px-4 py-8 sm:px-6 sm:py-10"
      style={{ backgroundColor: gameSimpleColors.headerBg }}
    >
      <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-4 sm:gap-8">
        <TeamColumn name={sides.home.name} code={sides.home.code} />
        <ScoreColumn
          scoreLabel={scoreLabel}
          statusVariant={statusVariant}
          statusLabel={statusLabel}
          kickoffLabel={kickoffLabel}
        />
        <TeamColumn
          name={sides.away.name}
          code={sides.away.code}
          align="right"
        />
      </div>
    </header>
  );
}

function TeamColumn({
  name,
  code,
  align = "left"
}: {
  name: string;
  code?: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3",
        align === "right" ? "items-end text-right" : "items-start text-left"
      )}
    >
      <TeamFlag
        code={code}
        name={name}
        className="h-[85px] w-[85px] rounded-[12px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <span className="text-[26px] font-[556] capitalize leading-[31px] text-white">
        {name}
      </span>
    </div>
  );
}

function ScoreColumn({
  scoreLabel,
  statusVariant,
  statusLabel,
  kickoffLabel
}: {
  scoreLabel: string;
  statusVariant: "ongoing" | "ended" | "upcoming";
  statusLabel: string;
  kickoffLabel: string;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2 text-center">
      <span className="text-[60px] font-[556] capitalize leading-[72px] text-white">
        {scoreLabel}
      </span>
      <div className="flex items-center gap-2">
        {statusVariant === "ongoing" ? (
          <span
            className="inline-block h-[14px] w-[14px] rounded-full border-[3px]"
            style={{
              backgroundColor: gameSimpleColors.statusLive,
              borderColor: "rgba(123, 202, 37, 0.3)"
            }}
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            "text-sm font-[556] capitalize leading-[17px]",
            statusVariant === "ongoing"
              ? "text-[#7BCA25]"
              : "text-[#909090]"
          )}
        >
          {statusLabel}
        </span>
      </div>
      <span className="text-sm font-[556] leading-[17px] text-[#909090]">
        {kickoffLabel}
      </span>
    </div>
  );
}
