"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatProbability } from "@/components/home/market-formatters";
import { TradeAuthActionButton } from "@/components/trading/trade-auth-action-button";
import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { cn } from "@/lib/cn";
import {
  formatOrderBookClearingKickoff
} from "@/lib/market/limit-order-clearing-tip";
import {
  formatLimitPriceInputValue,
  formatShareSize,
  formatOrderbookPrice,
  isCompleteLimitPriceDisplayValue,
  parseLimitPriceDisplayValue,
  sanitizeLimitPriceDisplayInput
} from "@/lib/market/order-math";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { BidTradeSide } from "@/types/market";
import type { LimitExpirationPreset } from "@/store/trade-ticket-store";
import { LimitExpirationSelect } from "@/views/trade/trade-widget/limit-expiration-select";
import { TakeProfitLimitRow } from "@/views/trade/trade-widget/take-profit-limit-row";
import {
  deriveLimitBuyTotal,
  deriveOutcomeSummaryValue,
  type OrderPreviewFields,
  type TradeTicketStatus
} from "@/views/trade/trade-widget/trade-ticket-helpers";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";
import { translateTradeMessage } from "@/views/trade/trade-widget/trade-i18n";
import { tradeQuickAmountClass, TRADE_BID_BUTTON_ID } from "@/views/trade/trade-widget/trade-ui";

const QUICK_AMOUNTS = [1, 5, 10, 100] as const;
const LIMIT_BUY_SHARE_DELTAS = [-100, -10, 10, 100] as const;

const SELL_QUICK_FRACTIONS = [
  { labelKey: "quickAmount25", value: 0.25 },
  { labelKey: "quickAmount50", value: 0.5 },
  { labelKey: "quickAmount75", value: 0.75 }
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
  takeProfitLimitError?: string;
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
  yesButtonLabel?: string;
  noButtonLabel?: string;
  yesButtonActive?: boolean;
  noButtonActive?: boolean;
  onTakeProfitLimitEnabledChange?: (value: boolean) => void;
  onTakeProfitLimitPriceChange?: (value: string) => void;
  walletInsight?: ReactNode;
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
  takeProfitLimitError,
  fundingMessage,
  actionLabel,
  canSubmit,
  actionInProgress,
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
  takeProfitLimitPrice = "",
  outcomeButtonClassName,
  outcomeButtonContainerClassName,
  yesButtonLabel,
  noButtonLabel,
  yesButtonActive,
  noButtonActive,
  onTakeProfitLimitEnabledChange,
  onTakeProfitLimitPriceChange,
  walletInsight
}: TradeTicketFormProps) {
  const t = useTranslations("trade");
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();
  const isLimitOrder = orderMode === "limit";
  const outcomeSummaryLabel =
    tradeSide === "sell" ? t("youWillReceive") : t("toWin");
  const amountInputLabel =
    isLimitOrder || tradeSide === "sell" ? t("shares") : t("value");
  const summaryValue = deriveOutcomeSummaryValue(tradeSide, preview);
  const sellQuickDisabled = availableShares <= 0;
  const showCashBalance =
    isLimitOrder && tradeSide === "buy" && availableCash !== undefined;
  const showClearingTip = isLimitOrder && Boolean(kickoffAt);
  const displayMessage =
    expirationError ?? takeProfitLimitError ?? message ?? fundingMessage;
  const displayMessageIsError = Boolean(
    expirationError || takeProfitLimitError || message || fundingMessage
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
          active={yesButtonActive ?? outcomeSide === "yes"}
          priceLabel={formatOutcomeDisplay(yesTokenPrice)}
          probabilityLabel={formatProbability(yesProbability)}
          shareCount={tradeSide === "sell" ? yesShares : undefined}
          buttonLabel={yesButtonLabel}
          onSelect={() => onSelectOutcome("yes")}
          buttonClassName={outcomeButtonClassName}
        />
        <OutcomeButtonColumn
          side="no"
          active={noButtonActive ?? outcomeSide === "no"}
          priceLabel={formatOutcomeDisplay(noTokenPrice)}
          probabilityLabel={formatProbability(noProbability)}
          shareCount={tradeSide === "sell" ? noShares : undefined}
          buttonLabel={noButtonLabel}
          onSelect={() => onSelectOutcome("no")}
          buttonClassName={outcomeButtonClassName}
        />
      </div>

      {walletInsight}

      {isLimitOrder ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-[500] leading-[17px] text-prophet-foreground">
            {t("limitPrice")}
          </span>
          <label className="sr-only" htmlFor="trade-limit-price">
            {t("limitPriceSrOnly")}
          </label>
          <LimitPriceInput
            limitPrice={limitPrice}
            sidePrice={preview.sidePrice}
            onLimitPriceChange={onLimitPriceChange}
            onAmountMessageClear={onAmountMessageClear}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-[500] leading-[17px] text-prophet-foreground">
              {amountInputLabel}
            </span>
            {showCashBalance ? (
              <span className="text-xs font-[400] leading-4 text-prophet-muted">
                {formatTeamDetailMoney(availableCash)} {t("cashSuffix")}
              </span>
            ) : null}
          </div>
          <label className="sr-only" htmlFor="trade-amount">
            {isLimitOrder || tradeSide === "sell"
              ? t("orderSizeInShares")
              : t("orderAmountInUsdc")}
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
              className="border-0 bg-transparent p-0 leading-[38px] text-prophet-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {tradeSide === "sell" ? (
            <>
              {SELL_QUICK_FRACTIONS.map(({ labelKey, value }) => (
                <button
                  key={labelKey}
                  type="button"
                  className={cn(
                    tradeQuickAmountClass,
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  disabled={sellQuickDisabled}
                  onClick={() => onQuickAmount(value)}
                >
                  {t(labelKey)}
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
                {t("max")}
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
            <span className="text-[14px] font-[400] leading-[17px] text-prophet-foreground">
              {outcomeSummaryLabel}
            </span>
            <span className="text-sm font-[400] leading-[17px] text-prophet-muted">
              {t("avgPrice", {
                price: formatOrderbookPrice(preview.sidePrice)
              })}
            </span>
          </div>
          <span className="text-[26px] font-[500] leading-[38px] text-[#69C800]">
            {formatTeamDetailMoney(summaryValue)}
          </span>
        </div>
      )}

      <div id={TRADE_BID_BUTTON_ID} className="w-full">
        <TradeAuthActionButton
          tradeSide={tradeSide}
          outcomeSide={outcomeSide}
          actionLabel={actionLabel}
          connectLabel={t("enableTrading")}
          connectingLabel={t("connecting")}
          signingLabel={t("waitingForSignature")}
          submittingLabel={t("submittingOrderStatus")}
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
      </div>

      {displayMessage ? (
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "m-0 whitespace-pre-line text-xs",
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
              className="self-start text-xs font-[500] text-prophet-foreground underline underline-offset-2 disabled:opacity-50"
              disabled={actionInProgress || status === "loading"}
              onClick={() => void onRetryEligibility()}
            >
              {t("retryEligibilityCheck")}
            </button>
          ) : null}
        </div>
      ) : preview.disabledReason && amount !== "0" ? (
        <p className="m-0 text-xs text-prophet-muted">
          {translateTradeMessage(preview.disabledReason, t)}
        </p>
      ) : null}

      {showClearingTip && kickoffAt ? (
        <OrderBookClearingTip kickoffAt={kickoffAt} />
      ) : null}
    </div>
  );
}

function LimitPriceInput({
  limitPrice,
  sidePrice,
  onLimitPriceChange,
  onAmountMessageClear
}: {
  limitPrice: string;
  sidePrice: number;
  onLimitPriceChange: (value: string) => void;
  onAmountMessageClear: () => void;
}) {
  const [displayValue, setDisplayValue] = useState(() =>
    formatLimitPriceInputValue(limitPrice)
  );
  const lastEmittedLimitPriceRef = useRef(limitPrice);

  useEffect(() => {
    if (limitPrice === lastEmittedLimitPriceRef.current) {
      return;
    }

    lastEmittedLimitPriceRef.current = limitPrice;
    setDisplayValue(formatLimitPriceInputValue(limitPrice));
  }, [limitPrice]);

  return (
    <div className="flex min-w-0 items-baseline justify-end">
      <input
        id="trade-limit-price"
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(event) => {
          const sanitized = sanitizeLimitPriceDisplayInput(event.target.value);
          setDisplayValue(sanitized);

          if (sanitized === "") {
            lastEmittedLimitPriceRef.current = "";
            onLimitPriceChange("");
            onAmountMessageClear();
            return;
          }

          if (!isCompleteLimitPriceDisplayValue(sanitized)) {
            return;
          }

          const parsed = parseLimitPriceDisplayValue(sanitized, sidePrice);
          lastEmittedLimitPriceRef.current = parsed;
          onLimitPriceChange(parsed);
          onAmountMessageClear();
        }}
        className="min-w-[4ch] max-w-[8ch] flex-1 border-0 bg-transparent p-0 text-right text-[32px] font-[500] leading-[38px] text-prophet-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
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
  const t = useTranslations("trade");
  const outcomeSummaryLabel =
    tradeSide === "sell" ? t("youWillReceive") : t("toWin");
  const summaryValue = deriveOutcomeSummaryValue(tradeSide, preview);

  return (
    <div className="flex flex-col gap-3 border-t border-prophet-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-[500] leading-[17px] text-prophet-foreground">
          {t("expiration")}
        </span>
        <LimitExpirationSelect
          value={limitExpiration}
          customDate={limitExpirationCustom}
          onChange={onLimitExpirationChange}
          onCustomDateChange={onLimitExpirationCustomChange}
        />
      </div>

      {tradeSide === "buy" ? (
        <div className="flex items-center justify-between gap-2 border-t border-prophet-line pt-3">
          <span className="text-sm font-[500] leading-[17px] text-prophet-foreground">
            {t("total")}
          </span>
          <span className="text-sm font-[500] leading-[17px] text-[#0d69ff]">
            {formatTeamDetailMoney(deriveLimitBuyTotal(preview))}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-prophet-line pt-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-[500] leading-[17px] text-prophet-foreground">
            {outcomeSummaryLabel}
          </span>
        </div>
        <span className="text-sm font-[500] leading-[17px] text-[#69C800]">
          {formatTeamDetailMoney(summaryValue)}
        </span>
      </div>
    </div>
  );
}

function OrderBookClearingTip({ kickoffAt }: { kickoffAt: string }) {
  const t = useTranslations("trade");
  const locale = useLocale();
  const kickoffLabel = formatOrderBookClearingKickoff(kickoffAt, locale);

  return (
    <div className="flex items-center justify-center gap-1 text-center">
      <span className="text-xs font-[400] leading-4 text-prophet-muted">
        {t("orderBookClearingTip", { kickoff: kickoffLabel })}
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
  buttonLabel,
  className,
  buttonClassName,
  onSelect
}: {
  side: "yes" | "no";
  active: boolean;
  priceLabel: string;
  probabilityLabel: string;
  shareCount?: number;
  buttonLabel?: string;
  className?: string;
  buttonClassName?: string;
  onSelect: () => void;
}) {
  const t = useTranslations("trade");
  const isYes = side === "yes";
  const showShares = shareCount !== undefined && shareCount > 0;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <OutcomeButton
        side={side}
        active={active}
        priceLabel={priceLabel}
        probabilityLabel={probabilityLabel}
        buttonLabel={buttonLabel}
        onSelect={onSelect}
        buttonClassName={buttonClassName}
      />
      {showShares ? (
        <span
          className={cn(
            "text-xs font-[500] leading-4",
            isYes ? "text-[#65AF14]" : "text-[#FF674B]"
          )}
        >
          {t("sharesCount", { count: formatShareSize(shareCount) })}
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
  buttonLabel,
  buttonClassName,
  onSelect
}: {
  side: "yes" | "no";
  active: boolean;
  priceLabel: string;
  probabilityLabel: string;
  buttonLabel?: string;
  buttonClassName?: string;
  onSelect: () => void;
}) {
  const t = useTranslations("trade");
  const isYes = side === "yes";
  const label = buttonLabel ?? (isYes ? t("yes") : t("no"));

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
            ? "border-prophet-line bg-prophet-panel text-[#65AF14] hover:bg-[#fafbfc]"
            : "border-[#FF674B] bg-prophet-panel text-[#FF674B] hover:bg-[#fafbfc]",
        buttonClassName
      )}
    >
      <span className="text-[20px] font-[500] leading-6">{label}</span>
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
