"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";

import { positionCardShellClassName, positionCardShellStyle } from "./constants";
import { PositionCardFooter } from "./position-card-footer";
import { PositionCardHeader } from "./position-card-header";
import { PositionPickList } from "./position-pick-list";
import type { PositionCardProps } from "./types";

export type { PositionCardProps, PositionPick } from "./types";

export function PositionCard({
  picks,
  multiplier,
  stakeAmount,
  toWinAmount: toWinAmountProp,
  className
}: PositionCardProps) {
  const computedToWin = useMemo(
    () => stakeAmount * multiplier,
    [stakeAmount, multiplier]
  );
  const toWinAmount = toWinAmountProp ?? computedToWin;

  return (
    <article
      className={cn(positionCardShellClassName, className)}
      style={positionCardShellStyle}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-1.5 pb-1.5 pt-3">
        <div className="px-1.5">
          <PositionCardHeader
            pickCount={picks.length}
            multiplier={multiplier}
          />
        </div>

        <div className="min-h-0 flex-1 px-1.5">
          <PositionPickList picks={picks} />
        </div>
      </div>

      <div className="shrink-0 px-1.5 pb-1.5">
        <PositionCardFooter
          stakeAmount={stakeAmount}
          toWinAmount={toWinAmount}
        />
      </div>
    </article>
  );
}
