"use client";

import { useMemo, useState } from "react";

import { formatTradePanelPrice } from "@/lib/market/order-math";
import {
  buildGameBidOrderPreview,
  getDefaultGameLimitPrice
} from "@/lib/market/game-order";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { cn } from "@/lib/cn";
import type { GameMarketSnapshot, MatchOutcomeSide } from "@/types/market";
import {
  tradeBidButtonClass,
  tradeQuickAmountClass
} from "@/views/trade/trade-widget/trade-ui";

const QUICK_AMOUNTS = [10, 50, 100] as const;

export interface GameBuyPanelProps {
  snapshot: GameMarketSnapshot;
  outcomeSide: MatchOutcomeSide;
  onOutcomeSideChange: (side: MatchOutcomeSide) => void;
  hideOutcomeSelector?: boolean;
}

export function GameBuyPanel({
  snapshot,
  outcomeSide,
  onOutcomeSideChange,
  hideOutcomeSelector = false
}: GameBuyPanelProps) {
  const [amount, setAmount] = useState("100");

  const numericAmount = Number(amount);
  const orderAmount = Number.isFinite(numericAmount)
    ? Math.max(0, numericAmount)
    : 0;
  const orderLimitPrice = getDefaultGameLimitPrice(snapshot, outcomeSide);

  const preview = useMemo(
    () =>
      buildGameBidOrderPreview({
        snapshot,
        outcomeSide,
        tradeSide: "buy",
        amount: orderAmount,
        limitPrice: orderLimitPrice,
        orderType: "FAK"
      }),
    [orderAmount, orderLimitPrice, outcomeSide, snapshot]
  );

  const outcomes = snapshot.outcomes;

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-3">
      {!hideOutcomeSelector ? (
        <div className="grid grid-cols-3 gap-2">
          {outcomes.map((outcome) => (
            <OutcomeButton
              key={outcome.side}
              side={outcome.side}
              label={
                outcome.side === "draw"
                  ? "Draw"
                  : outcome.side === "home"
                    ? "Home"
                    : "Away"
              }
              active={outcomeSide === outcome.side}
              probability={outcome.probability}
              onSelect={() => onOutcomeSideChange(outcome.side)}
            />
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-prophet-line p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-[556] leading-[17px] text-black">
            Amount
          </span>
          <div className="flex min-w-0 items-baseline justify-end">
            <span className="text-[32px] font-[556] leading-[38px] text-black">
              $
            </span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="min-w-[3ch] max-w-[8ch] flex-1 border-0 bg-transparent p-0 text-right text-[32px] font-[556] leading-[38px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Order amount in USDC"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className={tradeQuickAmountClass}
              onClick={() => setAmount(String(value))}
            >
              +{value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-[556] leading-[17px] text-black">
            Potential outcome
          </span>
          <span className="text-sm font-[457] leading-[17px] text-prophet-muted">
            Avg. Price {formatTradePanelPrice(preview.sidePrice)}
          </span>
        </div>
        <span className="text-[32px] font-[556] leading-[38px] text-[#69C800]">
          {formatTeamDetailMoney(preview.potentialOutcome)}
        </span>
      </div>

      <button
        type="button"
        className={tradeBidButtonClass}
        disabled
        aria-disabled="true"
      >
        Preview only
      </button>

      {preview.disabledReason ? (
        <p className="m-0 text-xs text-prophet-muted">{preview.disabledReason}</p>
      ) : null}

      <p className="m-0 text-[11px] leading-relaxed text-prophet-muted">
        Match market orders are preview-only until a Polymarket fixture market is
        linked. Analytical context only — not financial advice.
      </p>
    </div>
  );
}

function OutcomeButton({
  side,
  label,
  active,
  probability,
  onSelect
}: {
  side: MatchOutcomeSide;
  label: string;
  active: boolean;
  probability: number;
  onSelect: () => void;
}) {
  const tone =
    side === "home"
      ? active
        ? "border-[#65AF14] bg-[#65AF14] text-white"
        : "border-prophet-line bg-white text-[#65AF14]"
      : side === "draw"
        ? active
          ? "border-[#909090] bg-[#909090] text-white"
          : "border-prophet-line bg-white text-[#909090]"
        : active
          ? "border-[#FF674B] bg-[#FF674B] text-white"
          : "border-[#FF674B] bg-white text-[#FF674B]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-20 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 transition-colors",
        tone
      )}
    >
      <span className="text-sm font-[556] leading-4">{label}</span>
      <span className="text-lg font-[556] leading-[21px]">
        {formatTradePanelPrice(probability / 100)}
      </span>
      <span className="text-xs font-[556] leading-[14px]">{probability.toFixed(1)}%</span>
    </button>
  );
}
