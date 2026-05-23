"use client";

import Link from "next/link";

import { TeamFlag } from "@/components/teams/team-flag";
import { gameTradeHref } from "@/lib/routes/trade";
import { cn } from "@/lib/cn";
import { formatMatchScore } from "@/lib/market/match-display";
import {
  formatScheduleKickoff,
  getScheduleRowVariant,
  resolveMatchSides,
  type ScheduleRowVariant
} from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";

function MatchSide({
  name,
  code,
  emphasized
}: {
  name: string;
  code?: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <TeamFlag
        code={code}
        name={name}
        className="h-[33px] w-[33px] rounded-[6px] text-[33px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <span
        className={cn(
          "max-w-full truncate text-center text-base font-[556] leading-[19px]",
          emphasized ? "text-black" : "text-[#909090]"
        )}
      >
        {name}
      </span>
    </div>
  );
}

function MatchStatusBadge({ variant }: { variant: ScheduleRowVariant }) {
  const config = getStatusConfig(variant);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-[556] leading-[17px]",
        config.textClass
      )}
    >
      <span
        className={cn("shrink-0 rounded-full", config.dotClass)}
        aria-hidden
      />
      {config.label}
    </span>
  );
}

function getStatusConfig(variant: ScheduleRowVariant) {
  switch (variant) {
    case "ongoing":
      return {
        label: "ongoing",
        textClass: "text-[#7BCA25]",
        dotClass:
          "size-[9px] border-[3px] border-[rgba(123,202,37,0.3)] bg-[#7BCA25]"
      };
    case "ended":
      return {
        label: "ended",
        textClass: "text-[#909090]",
        dotClass: "size-2 bg-[#909090]"
      };
    default:
      return {
        label: "upcoming",
        textClass: "text-[#9B7BFF]",
        dotClass: "size-2 bg-[#9B7BFF]"
      };
  }
}

export interface RelatedGameCardProps {
  match: WorldCupMatch;
  snapshots: TeamMarketSnapshot[];
  highlightTeamId: string;
}

export function RelatedGameCard({
  match,
  snapshots,
  highlightTeamId
}: RelatedGameCardProps) {
  const sides = resolveMatchSides(match, snapshots);
  const scoreLabel = formatMatchScore(match.homeScore, match.awayScore);
  const kickoffLabel = formatScheduleKickoff(match.kickoffAt);
  const statusVariant = getScheduleRowVariant(match.status);

  return (
    <Link
      href={gameTradeHref(match.id)}
      className="block h-[122px] w-full max-w-[313px] rounded-xl bg-white px-4 py-3 shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_0_14px_rgba(0,0,0,0.14)]"
    >
      <div className="flex items-center justify-between">
        <MatchStatusBadge variant={statusVariant} />
        <span className="text-sm font-[556] leading-[17px] text-[#909090]">
          {kickoffLabel}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <MatchSide
          name={sides.home.name}
          code={sides.home.code}
          emphasized={match.homeTeamId === highlightTeamId}
        />
        <strong className="text-center text-[26px] font-[556] leading-[31px] text-black">
          {scoreLabel}
        </strong>
        <MatchSide
          name={sides.away.name}
          code={sides.away.code}
          emphasized={match.awayTeamId === highlightTeamId}
        />
      </div>
    </Link>
  );
}
