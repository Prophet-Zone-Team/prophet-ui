"use client";

import { Loader2 } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { FundingAsset, POLYMARKET_USD } from "@/config/funding";
import { useBridgeQuote } from "@/hooks/funding";
import {
  buildDepositQuoteRequest,
  formatQuoteCheckoutTime,
  formatQuoteTokenAmount,
  mapQuoteToBreakdown,
} from "@/lib/funding/bridge-quote";
import { formatShortWallet } from "@/lib/team/detail-format";
import { depositDetailRowClass } from "@/views/portfolio/deposit/deposit-ui";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { formatNumber } from "@/utils";

export interface DepositConfirmStepProps {
  walletAddress: string;
  token: FundingAsset;
  amount: string;
}

export function DepositConfirmStep({
  walletAddress,
  token,
  amount,
}: DepositConfirmStepProps) {
  const quoteRequest = useMemo(
    () => buildDepositQuoteRequest({ token, amount }),
    [amount, token],
  );

  const { quote, loading: quoteLoading, error: quoteError } = useBridgeQuote({
    request: quoteRequest,
    enabled: Boolean(quoteRequest),
  });

  const breakdown = quote ? mapQuoteToBreakdown(quote) : undefined;

  const estimatedTime = quote
    ? formatQuoteCheckoutTime(quote.estCheckoutTimeMs)
    : quoteLoading
      ? "…"
      : "--";

  const receiveAmount = quote
    ? formatQuoteTokenAmount(quote.estToTokenBaseUnit, POLYMARKET_USD.decimals)
    : amount;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="m-0 text-center text-[36px] font-[556] leading-[43px] text-black">
        {formatNumber(amount, token.decimals, true, { round: 0 })}
      </p>

      {quoteLoading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-[#909090]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Fetching quote…</span>
        </div>
      ) : null}

      {quoteError ? (
        <p className="m-0 text-center text-sm text-prophet-red">{quoteError}</p>
      ) : null}

      <div className="flex flex-col">
        <DetailRow label="From">
          <span className="flex items-center gap-2">
            <WalletAvatarIcon />
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
            <span>{formatShortWallet(walletAddress)}</span>
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
              {quoteLoading
                ? "…"
                : formatNumber(receiveAmount, 4, true, { round: 0 })}
            </span>
          </span>
        </DetailRow>
      </div>

      <TransactionBreakdown
        loading={quoteLoading && Boolean(quoteRequest)}
        networkCostUsd={breakdown?.networkCost}
        priceImpactPercent={breakdown?.priceImpactPercent}
        maxSlippagePercent={breakdown?.maxSlippagePercent}
      />
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={depositDetailRowClass}>
      <span className="text-[#909090]">{label}</span>
      <span className="flex-1 border-t border-[#EBEBEB]/60"></span>
      <span className="font-[556] text-black">{children}</span>
    </div>
  );
}
