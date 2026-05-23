"use client";

import { cn } from "../../../lib/cn";
import {
  getMatchResultBarColor,
  type MatchResultWinner
} from "../../../lib/market/matchResult";

export interface MatchResultBarProps {
  winner: MatchResultWinner | undefined;
  className?: string;
}

export function MatchResultBar({ winner, className }: MatchResultBarProps) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full", className)}
      style={{ background: getMatchResultBarColor(winner) }}
      aria-hidden
    />
  );
}
