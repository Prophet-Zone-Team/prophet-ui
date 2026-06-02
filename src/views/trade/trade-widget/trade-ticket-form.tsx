"use client";

import { formatProbability } from "@/components/home/market-formatters";
import { TradeAuthActionButton } from "@/components/trading/trade-auth-action-button";
import { cn } from "@/lib/cn";
import {
  formatOrderBookClearingTip,
  formatOrderBookClearingTooltip
} from "@/lib/market/limit-order-clearing-tip";
import {
  formatLimitPriceInputValue,
  formatShareSize,
  formatOrderbookPrice,
  parseLimitPriceDisplayValue
} from "@/lib/market/order-math";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { BidTradeSide } from "@/types/market";
import type { LimitExpirationPreset } from "@/store/trade-ticket-store";
import { LimitExpirationSelect } from "@/views/trade/trade-widget/limit-expiration-select";
import { TakeProfitLimitRow } from "@/views/trade/trade-widget/take-profit-limit-row";
import {
  deriveAmountInputLabel,
  deriveLimitBuyTotal,
  deriveOutcomeSummaryLabel,
  deriveOutcomeSummaryValue,
  type OrderPreviewFields,
  type TradeTicketStatus
} from "@/views/trade/trade-widget/trade-ticket-helpers";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";
import { tradeQuickAmountClass } from "@/views/trade/trade-widget/trade-ui";

const QUICK_AMOUNTS = [1, 5, 10, 100] as const;
const LIMIT_BUY_SHARE_DELTAS = [-100, -10, 10, 100] as const;

const SELL_QUICK_FRACTIONS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 }
] as const;

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
  yesShares?: number;
  noShares?: number;
  availableShares?: number;
  availableCash?: number;
  kickoffAt?: string;
  limitExpiration: LimitExpirationPreset;
  limitExpirationCustom?: string;
  expirationError?: string;
  fundingMessage?: string;
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
  onLimitExpirationChange: (value: LimitExpirationPreset) => void;
  onLimitExpirationCustomChange: (value: string) => void;
  onQuickAmount: (value: number | "all") => void;
  onSubmit: () => void | Promise<void>;
  onRetryEligibility?: () => void | Promise<void>;
  onLoginStart: () => void;
  onLoginSuccess: () => void | Promise<void>;
  onLoginError: (error: Error) => void;
  onAmountMessageClear: () => void;
  takeProfitLimitEnabled?: boolean;
  takeProfitLimitDisabled?: boolean;
  takeProfitLimitPrice?: string;
  outcomeButtonClassName?: string;
  outcomeButtonContainerClassName?: string;
  onTakeProfitLimitEnabledChange?: (value: boolean) => void;
  onTakeProfitLimitPriceChange?: (value: string) => void;
}

export function TradeTicketForm({
  yesTokenPrice,
  noTokenPrice,
  yesProbability,
  noProbability,
  outcomeSide,
  orderMode,
  tradeSide,
  amount = "0",
  limitPrice,
  preview,
  yesShares = 0,
  noShares = 0,
  availableShares = 0,
  availableCash,
  kickoffAt,
  limitExpiration,
  limitExpirationCustom,
  expirationError,
  fundingMessage,
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
  onLimitExpirationChange,
  onLimitExpirationCustomChange,
  onQuickAmount,
  onSubmit,
  onRetryEligibility,
  onLoginStart,
  onLoginSuccess,
  onLoginError,
  onAmountMessageClear,
  takeProfitLimitEnabled = false,
  takeProfitLimitDisabled = false,
  takeProfitLimitPrice = "0.012",
  outcomeButtonClassName,
  outcomeButtonContainerClassName,
  onTakeProfitLimitEnabledChange,
  onTakeProfitLimitPriceChange
}: TradeTicketFormProps) {
  const isLimitOrder = orderMode === "limit";
  const outcomeSummaryLabel = deriveOutcomeSummaryLabel(tradeSide);
  const amountInputLabel = deriveAmountInputLabel(orderMode, tradeSide);
  const summaryValue = deriveOutcomeSummaryValue(tradeSide, preview);
  const sellQuickDisabled = availableShares <= 0;
  const showCashBalance =
    isLimitOrder && tradeSide === "buy" && availableCash !== undefined;
  const showClearingTip = isLimitOrder && Boolean(kickoffAt);
  const displayMessage = expirationError ?? message ?? fundingMessage;
  const displayMessageIsError = Boolean(
    expirationError || message || fundingMessage
  );

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
      <div
        className={cn(
          "grid grid-cols-2 gap-2",
          outcomeButtonContainerClassName
        )}
      >
        <OutcomeButtonColumn
          side="yes"
          active={outcomeSide === "yes"}
          priceLabel={formatOrderbookPrice(yesTokenPrice)}
          probabilityLabel={formatProbability(yesProbability)}
          shareCount={tradeSide === "sell" ? yesShares : undefined}
          onSelect={() => onSelectOutcome("yes")}
          buttonClassName={outcomeButtonClassName}
        />
        <OutcomeButtonColumn
          side="no"
          active={outcomeSide === "no"}
          priceLabel={formatOrderbookPrice(noTokenPrice)}
          probabilityLabel={formatProbability(noProbability)}
          shareCount={tradeSide === "sell" ? noShares : undefined}
          onSelect={() => onSelectOutcome("no")}
          buttonClassName={outcomeButtonClassName}
        />
      </div>

      {isLimitOrder ? (
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
              min={1}
              max={99}
              step={0.1}
              inputMode="decimal"
              value={formatLimitPriceInputValue(limitPrice)}
              onChange={(event) => {
                onLimitPriceChange(
                  parseLimitPriceDisplayValue(
                    event.target.value,
                    preview.sidePrice
                  )
                );
                onAmountMessageClear();
              }}
              className="min-w-[4ch] max-w-[8ch] flex-1 border-0 bg-transparent p-0 text-right text-[32px] font-[556] leading-[38px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-[556] leading-[17px] text-black">
              {amountInputLabel}
            </span>
            {showCashBalance ? (
              <span className="text-xs font-[457] leading-4 text-prophet-muted">
                {formatTeamDetailMoney(availableCash)} cash
              </span>
            ) : null}
          </div>
          <label className="sr-only" htmlFor="trade-amount">
            {isLimitOrder || tradeSide === "sell"
              ? "Order size in shares"
              : "Order amount in USDC"}
          </label>
          <div className="flex flex-1  items-baseline justify-end  text-[26px] font-[500]">
            {!isLimitOrder && tradeSide !== "sell" && <span>$</span>}
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
              style={{ fieldSizing: "content" }}
              className="border-0 bg-transparent p-0 leading-[38px] text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {tradeSide === "sell" ? (
            <>
              {SELL_QUICK_FRACTIONS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  className={cn(
                    tradeQuickAmountClass,
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  disabled={sellQuickDisabled}
                  onClick={() => onQuickAmount(value)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  tradeQuickAmountClass,
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                disabled={sellQuickDisabled}
                onClick={() => onQuickAmount("all")}
              >
                Max
              </button>
            </>
          ) : isLimitOrder ? (
            LIMIT_BUY_SHARE_DELTAS.map((delta) => (
              <button
                key={delta}
                type="button"
                className={tradeQuickAmountClass}
                onClick={() => onQuickAmount(delta)}
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))
          ) : (
            <>
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
              {/* <button
                type="button"
                className={tradeQuickAmountClass}
                onClick={() => onQuickAmount("all")}
              >
                All-in
              </button> */}
            </>
          )}
        </div>
      </div>

      {!isLimitOrder &&
      tradeSide === "buy" &&
      onTakeProfitLimitEnabledChange ? (
        <TakeProfitLimitRow
          enabled={takeProfitLimitEnabled}
          disabled={takeProfitLimitDisabled}
          price={takeProfitLimitPrice}
          purchasePrice={preview.sidePrice}
          onEnabledChange={onTakeProfitLimitEnabledChange}
          onPriceChange={(value) => onTakeProfitLimitPriceChange?.(value)}
        />
      ) : null}

      {isLimitOrder ? (
        <LimitOrderSummary
          tradeSide={tradeSide}
          preview={preview}
          limitExpiration={limitExpiration}
          limitExpirationCustom={limitExpirationCustom}
          onLimitExpirationChange={onLimitExpirationChange}
          onLimitExpirationCustomChange={onLimitExpirationCustomChange}
        />
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-[400] leading-[17px] text-black">
              {outcomeSummaryLabel}
            </span>
            <span className="text-sm font-[457] leading-[17px] text-prophet-muted">
              Avg. Price {formatOrderbookPrice(preview.sidePrice)}
            </span>
          </div>
          <span className="text-[26px] font-[500] leading-[38px] text-[#69C800]">
            {formatTeamDetailMoney(summaryValue)}
          </span>
        </div>
      )}

      <TradeAuthActionButton
        actionLabel={actionLabel}
        connectLabel="Enable trading"
        canSubmit={canSubmit && !actionInProgress}
        connectDisabled={status === "loading"}
        actionStatus={
          status === "signing" || status === "submitting" ? status : undefined
        }
        onAction={onSubmit}
        onLoginStart={onLoginStart}
        onLoginSuccess={onLoginSuccess}
        onLoginError={onLoginError}
      />

      {displayMessage ? (
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "m-0 text-xs",
              status === "error" || displayMessageIsError
                ? "text-prophet-red"
                : "text-prophet-muted"
            )}
          >
            {amount !== "0" ? displayMessage : ""}
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
      ) : preview.disabledReason && amount !== "0" ? (
        <p className="m-0 text-xs text-prophet-muted">
          {preview.disabledReason}
        </p>
      ) : null}

      {showClearingTip && kickoffAt ? (
        <OrderBookClearingTip kickoffAt={kickoffAt} />
      ) : null}
    </div>
  );
}

function LimitOrderSummary({
  tradeSide,
  preview,
  limitExpiration,
  limitExpirationCustom,
  onLimitExpirationChange,
  onLimitExpirationCustomChange
}: {
  tradeSide: BidTradeSide;
  preview: OrderPreviewFields;
  limitExpiration: LimitExpirationPreset;
  limitExpirationCustom?: string;
  onLimitExpirationChange: (value: LimitExpirationPreset) => void;
  onLimitExpirationCustomChange: (value: string) => void;
}) {
  const outcomeSummaryLabel = deriveOutcomeSummaryLabel(tradeSide);
  const summaryValue = deriveOutcomeSummaryValue(tradeSide, preview);

  return (
    <div className="flex flex-col gap-3 border-t border-prophet-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-[556] leading-[17px] text-black">
          Expiration
        </span>
        <LimitExpirationSelect
          value={limitExpiration}
          customDate={limitExpirationCustom}
          onChange={onLimitExpirationChange}
          onCustomDateChange={onLimitExpirationCustomChange}
        />
      </div>

      {tradeSide === "buy" ? (
        <div className="flex items-center justify-between gap-2 border-t border-prophet-line/60 pt-3">
          <span className="text-sm font-[556] leading-[17px] text-black">
            Total
          </span>
          <span className="text-sm font-[556] leading-[17px] text-[#0d69ff]">
            {formatTeamDetailMoney(deriveLimitBuyTotal(preview))}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-prophet-line/60 pt-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-[556] leading-[17px] text-black">
            {outcomeSummaryLabel}
          </span>
        </div>
        <span className="text-sm font-[556] leading-[17px] text-[#69C800]">
          {formatTeamDetailMoney(summaryValue)}
        </span>
      </div>
    </div>
  );
}

function OrderBookClearingTip({ kickoffAt }: { kickoffAt: string }) {
  const tip = formatOrderBookClearingTip(kickoffAt);
  const tooltip = formatOrderBookClearingTooltip(kickoffAt);

  return (
    <div className="flex items-center justify-center gap-1 text-center">
      <span className="text-xs font-[457] leading-4 text-prophet-muted">
        {tip}
      </span>
    </div>
  );
}

function OutcomeButtonColumn({
  side,
  active,
  priceLabel,
  probabilityLabel,
  shareCount,
  className,
  buttonClassName,
  onSelect
}: {
  side: "yes" | "no";
  active: boolean;
  priceLabel: string;
  probabilityLabel: string;
  shareCount?: number;
  className?: string;
  buttonClassName?: string;
  onSelect: () => void;
}) {
  const isYes = side === "yes";
  const showShares = shareCount !== undefined && shareCount > 0;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <OutcomeButton
        side={side}
        active={active}
        priceLabel={priceLabel}
        probabilityLabel={probabilityLabel}
        onSelect={onSelect}
        buttonClassName={buttonClassName}
      />
      {showShares ? (
        <span
          className={cn(
            "text-xs font-[556] leading-4",
            isYes ? "text-[#65AF14]" : "text-[#FF674B]"
          )}
        >
          {formatShareSize(shareCount)} shares
        </span>
      ) : null}
    </div>
  );
}

function OutcomeButton({
  side,
  active,
  priceLabel,
  probabilityLabel,
  buttonClassName,
  onSelect
}: {
  side: "yes" | "no";
  active: boolean;
  priceLabel: string;
  probabilityLabel: string;
  buttonClassName?: string;
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
            : "border-[#FF674B] bg-white text-[#FF674B] hover:bg-[#fafbfc]",
        buttonClassName
      )}
    >
      <span className="text-[20px] font-[500] leading-6">
        {isYes ? "Yes" : "No"}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-[18px] font-[500]",
            active ? "text-white" : "inherit"
          )}
        >
          {priceLabel}
        </span>
        <span
          className={cn(
            "text-[12px] font-[500] mt-1",
            active ? "text-white" : "inherit"
          )}
        >
          {probabilityLabel}
        </span>
      </div>
    </button>
  );
}
