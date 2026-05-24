"use client";

import { formatProbability } from "@/components/home/market-formatters";
import { TradeAuthActionButton } from "@/components/trading/trade-auth-action-button";
import { cn } from "@/lib/cn";
import { formatTradePanelPrice } from "@/lib/market/order-math";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { BidTradeSide } from "@/types/market";
import {
  deriveAmountInputLabel,
  deriveOutcomeSummaryLabel,
  deriveOutcomeSummaryValue,
  type OrderPreviewFields,
  type TradeTicketStatus
} from "@/views/trade/trade-widget/trade-ticket-helpers";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";
import { tradeQuickAmountClass } from "@/views/trade/trade-widget/trade-ui";

const QUICK_AMOUNTS = [1, 5, 10, 100] as const;

export interface TradeTicketFormProps {
  yesTokenPrice: number;
  noTokenPrice: number;
  yesProbability: number;
  noProbability: number;
  outcomeSide: "yes" | "no";
  orderMode: TradeOrderMode;
  tradeSide: BidTradeSide;
  amount: string;
  limitPrice: string;
  preview: OrderPreviewFields;
  actionLabel: string;
  canSubmit: boolean;
  actionInProgress: boolean;
  isAuthenticated: boolean;
  status: TradeTicketStatus;
  message?: string;
  eligibilityRetryAvailable?: boolean;
  onSelectOutcome: (side: "yes" | "no") => void;
  onAmountChange: (value: string) => void;
  onLimitPriceChange: (value: string) => void;
  onQuickAmount: (value: number | "all") => void;
  onSubmit: () => void | Promise<void>;
  onRetryEligibility?: () => void | Promise<void>;
  onLoginStart: () => void;
  onLoginSuccess: () => void | Promise<void>;
  onLoginError: (error: Error) => void;
  onAmountMessageClear: () => void;
}

export function TradeTicketForm({
  yesTokenPrice,
  noTokenPrice,
  yesProbability,
  noProbability,
  outcomeSide,
  orderMode,
  tradeSide,
  amount,
  limitPrice,
  preview,
  actionLabel,
  canSubmit,
  actionInProgress,
  isAuthenticated,
  status,
  message,
  eligibilityRetryAvailable = false,
  onSelectOutcome,
  onAmountChange,
  onLimitPriceChange,
  onQuickAmount,
  onSubmit,
  onRetryEligibility,
  onLoginStart,
  onLoginSuccess,
  onLoginError,
  onAmountMessageClear
}: TradeTicketFormProps) {
  const outcomeSummaryLabel = deriveOutcomeSummaryLabel(tradeSide);
  const amountInputLabel = deriveAmountInputLabel(tradeSide);
  const summaryValue = deriveOutcomeSummaryValue(tradeSide, preview);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
      <div className="grid grid-cols-2 gap-2">
        <OutcomeButton
          side="yes"
          active={outcomeSide === "yes"}
          priceLabel={formatTradePanelPrice(yesTokenPrice)}
          probabilityLabel={formatProbability(yesProbability)}
          onSelect={() => onSelectOutcome("yes")}
        />
        <OutcomeButton
          side="no"
          active={outcomeSide === "no"}
          priceLabel={formatTradePanelPrice(noTokenPrice)}
          probabilityLabel={formatProbability(noProbability)}
          onSelect={() => onSelectOutcome("no")}
        />
      </div>

      {orderMode === "limit" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-[556] leading-[17px] text-black">
            Limit Price
          </span>
          <label className="sr-only" htmlFor="trade-limit-price">
            Limit price
          </label>
          <div className="flex min-w-0 items-baseline justify-end">
            <input
              id="trade-limit-price"
              type="number"
              min={0.01}
              max={0.99}
              step={0.001}
              inputMode="decimal"
              value={limitPrice}
              onChange={(event) => {
                onLimitPriceChange(event.target.value);
                onAmountMessageClear();
              }}
              className="min-w-[4ch] max-w-[8ch] flex-1 border-0 bg-transparent p-0 text-right text-[32px] font-[556] leading-[38px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-[556] leading-[17px] text-black">
            {amountInputLabel}
          </span>
          <label className="sr-only" htmlFor="trade-amount">
            {tradeSide === "sell"
              ? "Order size in shares"
              : "Order amount in USDC"}
          </label>
          <div className="flex min-w-0 items-baseline justify-end">
            <input
              id="trade-amount"
              type="number"
              min={0}
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                onAmountChange(event.target.value);
                onAmountMessageClear();
              }}
              className="min-w-[3ch] max-w-[8ch] flex-1 border-0 bg-transparent p-0 text-right text-[32px] font-[556] leading-[38px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className={tradeQuickAmountClass}
              onClick={() => onQuickAmount(value)}
            >
              +{value}
            </button>
          ))}
          <button
            type="button"
            className={tradeQuickAmountClass}
            onClick={() => onQuickAmount("all")}
          >
            All-in
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-[556] leading-[17px] text-black">
            {outcomeSummaryLabel}
          </span>
          <span className="text-sm font-[457] leading-[17px] text-prophet-muted">
            Avg. Price {formatTradePanelPrice(preview.sidePrice)}
          </span>
        </div>
        <span className="text-[32px] font-[556] leading-[38px] text-[#69C800]">
          {formatTeamDetailMoney(summaryValue)}
        </span>
      </div>

      <TradeAuthActionButton
        actionLabel={actionLabel}
        connectLabel="Enable trading"
        canSubmit={
          isAuthenticated ? !actionInProgress : canSubmit && !actionInProgress
        }
        connectDisabled={status === "loading"}
        actionStatus={
          status === "signing" || status === "submitting" ? status : undefined
        }
        onAction={onSubmit}
        onLoginStart={onLoginStart}
        onLoginSuccess={onLoginSuccess}
        onLoginError={onLoginError}
      />

      {message ? (
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "m-0 text-xs",
              status === "error" ? "text-prophet-red" : "text-prophet-muted"
            )}
          >
            {message}
          </p>
          {eligibilityRetryAvailable && onRetryEligibility ? (
            <button
              type="button"
              className="self-start text-xs font-[556] text-black underline underline-offset-2 disabled:opacity-50"
              disabled={actionInProgress || status === "loading"}
              onClick={() => void onRetryEligibility()}
            >
              Retry eligibility check
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OutcomeButton({
  side,
  active,
  priceLabel,
  probabilityLabel,
  onSelect
}: {
  side: "yes" | "no";
  active: boolean;
  priceLabel: string;
  probabilityLabel: string;
  onSelect: () => void;
}) {
  const isYes = side === "yes";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-20 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 transition-colors",
        active
          ? isYes
            ? "border-[#65AF14] bg-[#65AF14] text-white"
            : "border-[#FF674B] bg-[#FF674B] text-white"
          : isYes
            ? "border-prophet-line bg-white text-[#65AF14] hover:bg-[#fafbfc]"
            : "border-[#FF674B] bg-white text-[#FF674B] hover:bg-[#fafbfc]"
      )}
    >
      <span className="text-xl font-[556] leading-6">
        {isYes ? "Yes" : "No"}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-lg font-[556]",
            active ? "text-white" : "inherit"
          )}
        >
          {priceLabel}
        </span>
        <span
          className={cn(
            "text-xs font-[556] mt-1",
            active ? "text-white" : "inherit"
          )}
        >
          {probabilityLabel}
        </span>
      </div>
    </button>
  );
}
