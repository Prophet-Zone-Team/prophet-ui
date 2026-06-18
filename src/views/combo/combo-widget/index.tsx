"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import { ComboBidSection } from "./combo-bid-section";
import { ComboPicksSection } from "./combo-picks-section";
import { comboWidgetShellClassName } from "./constants";
import { TicketDivider } from "./ticket-divider";
import type { ComboWidgetProps } from "./types";

export type {
  ComboMoneylinePick,
  ComboPick,
  ComboPickOutcomeSide,
  ComboPickTeam,
  ComboSpreadPick,
  ComboWidgetProps
} from "./types";

export function ComboWidget({
  picks,
  multiplier,
  bidAmount: bidAmountProp,
  defaultBidAmount = 0,
  balance,
  toWinAmount: toWinAmountProp,
  onBidAmountChange,
  onApplyBalanceFraction,
  onPickOutcomeChange,
  onPickSpreadChange,
  onRemovePick,
  onSubmit,
  onInfoClick,
  isSubmitting = false,
  isSubmitDisabled = false,
  className
}: ComboWidgetProps) {
  const [bidAmountState, setBidAmountState] = useState(defaultBidAmount);
  const bidAmount = bidAmountProp ?? bidAmountState;

  const computedToWin = useMemo(
    () => bidAmount * multiplier,
    [bidAmount, multiplier]
  );
  const toWinAmount = toWinAmountProp ?? computedToWin;

  const handleBidInputChange = (rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);

    if (Number.isNaN(parsed) || parsed < 0) {
      if (bidAmountProp === undefined) {
        setBidAmountState(0);
      }
      onBidAmountChange?.(0);
      return;
    }

    if (bidAmountProp === undefined) {
      setBidAmountState(parsed);
    }

    onBidAmountChange?.(parsed);
  };

  const handleApplyFraction = (fraction: number) => {
    const nextAmount = balance * fraction;

    if (bidAmountProp === undefined) {
      setBidAmountState(nextAmount);
    }

    onApplyBalanceFraction?.(fraction);
    onBidAmountChange?.(nextAmount);
  };

  const submitDisabled =
    isSubmitDisabled || isSubmitting || picks.length === 0 || bidAmount <= 0;

  return (
    <section className={cn(comboWidgetShellClassName, className)}>
      <ComboPicksSection
        picks={picks}
        multiplier={multiplier}
        onInfoClick={onInfoClick}
        onPickOutcomeChange={onPickOutcomeChange}
        onPickSpreadChange={onPickSpreadChange}
        onRemovePick={onRemovePick}
      />

      <TicketDivider />

      <ComboBidSection
        bidAmount={bidAmount}
        balance={balance}
        toWinAmount={toWinAmount}
        isSubmitting={isSubmitting}
        isSubmitDisabled={submitDisabled}
        onBidAmountChange={handleBidInputChange}
        onApplyBalanceFraction={handleApplyFraction}
        onSubmit={onSubmit}
      />
    </section>
  );
}
