"use client";

import { cn } from "@/lib/cn";
import {
  getMatchResultBarColor,
  type MatchResultWinner
} from "@/lib/market/match-result";

export interface MatchResultBarProps {
  winner: MatchResultWinner | undefined;
  className?: string;
}

export function MatchResultBar({ winner, className }: MatchResultBarProps) {
  return (
    <div
      className={cn(
        "h-[8px] w-full overflow-hidden rounded-[4px] mt-[20px]",
        className
      )}
      style={{ background: getMatchResultBarColor(winner) }}
      aria-hidden
    />
  );
}
