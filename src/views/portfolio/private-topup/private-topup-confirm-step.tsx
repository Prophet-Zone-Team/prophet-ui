"use client";

import type { QuoteResponse } from "@stableflow/core";
import { Loader2 } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { POLYMARKET_USD } from "@/config/funding";
import { formatQuoteCheckoutTime } from "@/lib/funding/bridge-quote";
import {
  mapStableflowQuoteToBreakdownFees,
  mapStableflowQuoteToConfirmDisplay,
  STABLEFLOW_MAX_SLIPPAGE_PERCENT,
} from "@/lib/funding/stableflow";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import { depositDetailRowClass } from "@/views/portfolio/deposit/deposit-ui";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import type { PrivateTopupSelectableToken } from "@/views/portfolio/private-topup/types";
import { privateTopupSecureIconWrapClass } from "@/views/portfolio/private-topup/private-topup-ui";
import { cn } from "@/lib/cn";

export interface PrivateTopupConfirmStepProps {
  topupWalletAddress: string;
  privateAccountAddress: string;
  token: PrivateTopupSelectableToken;
  tokenAmount: string;
  amountUsd: string;
  stableflowQuote?: QuoteResponse;
  quoteLoading?: boolean;
  quoteError?: string;
}

export function PrivateTopupConfirmStep({
  topupWalletAddress,
  privateAccountAddress,
  token,
  tokenAmount,
  amountUsd,
  stableflowQuote,
  quoteLoading = false,
  quoteError,
}: PrivateTopupConfirmStepProps) {
  const t = useTranslations("privateTopup");
  const stableflowDisplay = useMemo(
    () =>
      stableflowQuote
        ? mapStableflowQuoteToConfirmDisplay(stableflowQuote)
        : undefined,
    [stableflowQuote],
  );

  const estimatedTime = stableflowDisplay
    ? formatQuoteCheckoutTime(stableflowDisplay.estCheckoutTimeMs)
    : quoteLoading
      ? "…"
      : "--";

  const receiveAmount = stableflowDisplay?.receiveAmountFormatted ?? "--";

  const breakdownFees = useMemo(() => {
    if (!stableflowQuote) {
      return {
        networkCostUsd: undefined,
        priceImpactPercent: undefined,
        maxSlippagePercent: STABLEFLOW_MAX_SLIPPAGE_PERCENT,
      };
    }

    const fees = mapStableflowQuoteToBreakdownFees(stableflowQuote);

    return {
      networkCostUsd: fees.networkCostUsd,
      priceImpactPercent: fees.priceImpactPercent,
      maxSlippagePercent: STABLEFLOW_MAX_SLIPPAGE_PERCENT,
    };
  }, [stableflowQuote]);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="m-0 text-center text-[36px] font-[500] leading-[43px] text-black">
        {formatNumber(amountUsd, 2, true, { prefix: "$", round: 0 })}
      </p>

      {quoteLoading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-[#909090]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{t("fetchingQuote")}</span>
        </div>
      ) : null}

      {quoteError ? (
        <p className="m-0 text-center text-sm text-prophet-red">{quoteError}</p>
      ) : null}

      <div className="flex flex-col">
        <DetailRow label={t("from")}>
          <span className="flex items-center gap-2">
            <WalletAvatarIcon address={topupWalletAddress} />
            <span>{formatShortWallet(topupWalletAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label={t("to")}>
          <span className="flex items-center gap-2">
            <div
              className={cn(
                privateTopupSecureIconWrapClass,
                "!rounded-[6px] !bg-black"
              )}
            >
              <img
                src="/icons/icon-secure.svg"
                alt=""
                className="size-3 object-contain"
                aria-hidden
              />
            </div>
            <span>{t("prophetPrivate")}</span>
            <span>{formatShortWallet(privateAccountAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label={t("estTime")}>
          <span>{estimatedTime}</span>
        </DetailRow>
        <DetailRow label={t("send")}>
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol={token.symbol}
              chainLabel={token.chainName}
              icon={token.icon}
              chainIcon={token.chainIcon}
              size="sm"
            />
            <span>{formatNumber(tokenAmount, 4, true, { round: 0 })}</span>
          </span>
        </DetailRow>
        <DetailRow label={t("estReceive")}>
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol={POLYMARKET_USD.symbol}
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
        loading={quoteLoading}
        networkCostUsd={breakdownFees.networkCostUsd}
        priceImpactPercent={breakdownFees.priceImpactPercent}
        maxSlippagePercent={breakdownFees.maxSlippagePercent}
        poweredByLogoSrc="/logos/logo-stableflow-full.svg"
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
      <span className="flex-1 border-t border-[#EBEBEB]/60" />
      <span className="font-[500] text-black">{children}</span>
    </div>
  );
}
