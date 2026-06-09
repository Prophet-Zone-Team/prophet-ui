"use client";

import type { QuoteResponse } from "@stableflow/core";
import { Loader2 } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { POLYMARKET_USD } from "@/config/funding";
import { useBridgeQuote } from "@/hooks/funding";
import {
  buildDepositQuoteRequest,
  formatQuoteCheckoutTime,
  formatQuoteTokenAmount,
  mapQuoteToBreakdown
} from "@/lib/funding/bridge-quote";
import {
  mapStableflowQuoteToBreakdownFees,
  mapStableflowQuoteToConfirmDisplay,
  STABLEFLOW_MAX_SLIPPAGE_PERCENT
} from "@/lib/funding/stableflow";
import { formatShortWallet } from "@/lib/team/detail-format";
import { depositDetailRowClass } from "@/views/portfolio/deposit/deposit-ui";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import type { DepositSelectableToken } from "@/views/portfolio/deposit/types";
import {
  TokenIcon,
  WalletAvatarIcon
} from "@/views/portfolio/shared/token-icon";
import { formatNumber } from "@/utils";

export interface DepositConfirmStepProps {
  walletAddress: string;
  token: DepositSelectableToken;
  amount: string;
  amountUsd: string;
  quoteMode?: "bridge" | "stableflow";
  stableflowQuote?: QuoteResponse;
  recipientAddress?: string;
}

export function DepositConfirmStep({
  walletAddress,
  token,
  amount,
  amountUsd,
  quoteMode = "bridge",
  stableflowQuote,
  recipientAddress
}: DepositConfirmStepProps) {
  const quoteRequest = useMemo(
    () =>
      quoteMode === "bridge"
        ? buildDepositQuoteRequest({ token, amount })
        : undefined,
    [amount, quoteMode, token]
  );

  const {
    quote,
    loading: quoteLoading,
    error: quoteError
  } = useBridgeQuote({
    request: quoteRequest,
    enabled: quoteMode === "bridge" && Boolean(quoteRequest)
  });

  const stableflowDisplay = useMemo(
    () =>
      stableflowQuote
        ? mapStableflowQuoteToConfirmDisplay(stableflowQuote)
        : undefined,
    [stableflowQuote]
  );

  const breakdown = quote ? mapQuoteToBreakdown(quote) : undefined;

  const stableflowBreakdownFees = useMemo(() => {
    if (!stableflowQuote) {
      return {
        networkCostUsd: undefined,
        priceImpactPercent: undefined,
        maxSlippagePercent: STABLEFLOW_MAX_SLIPPAGE_PERCENT
      };
    }

    const fees = mapStableflowQuoteToBreakdownFees(stableflowQuote);

    return {
      networkCostUsd: fees.networkCostUsd,
      priceImpactPercent: fees.priceImpactPercent,
      maxSlippagePercent: STABLEFLOW_MAX_SLIPPAGE_PERCENT
    };
  }, [stableflowQuote]);

  const estimatedTime =
    quoteMode === "stableflow" && stableflowDisplay
      ? formatQuoteCheckoutTime(stableflowDisplay.estCheckoutTimeMs)
      : quote
        ? formatQuoteCheckoutTime(quote.estCheckoutTimeMs)
        : quoteLoading
          ? "…"
          : "--";

  const receiveAmount =
    quoteMode === "stableflow" && stableflowDisplay
      ? stableflowDisplay.receiveAmountFormatted
      : quote
        ? formatQuoteTokenAmount(
            quote.estToTokenBaseUnit,
            POLYMARKET_USD.decimals
          )
        : amount;

  const toAddress = recipientAddress ?? walletAddress;
  const isStableflow = quoteMode === "stableflow";
  const showQuoteLoading = isStableflow ? false : quoteLoading;
  const showQuoteError = isStableflow ? undefined : quoteError;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="m-0 text-center text-[36px] font-[500] leading-[43px] text-black">
        {formatNumber(amountUsd, 2, true, { prefix: "$", round: 0 })}
      </p>

      {showQuoteLoading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-[#909090]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Fetching quote…</span>
        </div>
      ) : null}

      {showQuoteError ? (
        <p className="m-0 text-center text-sm text-prophet-red">
          {showQuoteError}
        </p>
      ) : null}

      <div className="flex flex-col">
        <DetailRow label="From">
          <span className="flex items-center gap-2">
            <WalletAvatarIcon address={walletAddress} />
            <span>{formatShortWallet(walletAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="To">
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol="USDC"
              chainLabel={POLYMARKET_USD.chainName}
              icon={POLYMARKET_USD.icon}
              chainIcon={POLYMARKET_USD.chainIcon}
              size="sm"
            />
            <span>{formatShortWallet(toAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="Est. Time">
          <span>{estimatedTime}</span>
        </DetailRow>
        <DetailRow label="Send">
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol={token.symbol}
              chainLabel={token.chainName}
              icon={token.icon}
              chainIcon={token.chainIcon}
              size="sm"
            />
            <span>{formatNumber(amount, 4, true, { round: 0 })}</span>
          </span>
        </DetailRow>
        <DetailRow label="Receive">
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol="USDC"
              chainLabel={POLYMARKET_USD.chainName}
              icon={POLYMARKET_USD.icon}
              chainIcon={POLYMARKET_USD.chainIcon}
              size="sm"
            />
            <span>
              {showQuoteLoading
                ? "…"
                : formatNumber(receiveAmount, 4, true, { round: 0 })}
            </span>
          </span>
        </DetailRow>
      </div>

      <TransactionBreakdown
        loading={isStableflow ? false : quoteLoading && Boolean(quoteRequest)}
        networkCostUsd={
          isStableflow
            ? stableflowBreakdownFees.networkCostUsd
            : breakdown?.networkCost
        }
        priceImpactPercent={
          isStableflow
            ? stableflowBreakdownFees.priceImpactPercent
            : breakdown?.priceImpactPercent
        }
        maxSlippagePercent={
          isStableflow
            ? stableflowBreakdownFees.maxSlippagePercent
            : breakdown?.maxSlippagePercent
        }
        poweredByLogoSrc={
          isStableflow ? "/logos/logo-stableflow-full.svg" : undefined
        }
      />
    </div>
  );
}

function DetailRow({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={depositDetailRowClass}>
      <span className="text-[#909090]">{label}</span>
      <span className="flex-1 border-t border-[#EBEBEB]/60"></span>
      <span className="font-[500] text-black">{children}</span>
    </div>
  );
}
