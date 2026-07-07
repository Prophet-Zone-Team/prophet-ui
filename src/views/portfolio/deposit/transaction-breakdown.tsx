"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatNumber } from "@/utils";
import {
  depositBreakdownBoxClass,
  depositBreakdownRowClass,
} from "@/views/portfolio/deposit/deposit-ui";

export interface TransactionBreakdownProps {
  loading?: boolean;
  networkCostUsd?: number;
  priceImpactPercent?: number;
  maxSlippagePercent?: number;
  poweredByLogoSrc?: string;
}

export function TransactionBreakdown({
  loading = false,
  networkCostUsd,
  priceImpactPercent,
  maxSlippagePercent,
  poweredByLogoSrc,
}: TransactionBreakdownProps) {
  const t = useTranslations("portfolio.deposit");
  const networkDisplay =
    loading || networkCostUsd === undefined
      ? "--"
      : formatNumber(networkCostUsd, 2, true, { round: 0, isZeroPrecision: true, prefix: "$" });

  const priceImpactDisplay =
    loading || priceImpactPercent === undefined ? "--" : `${priceImpactPercent.toFixed(2)}%`;

  const slippageDisplay =
    loading || maxSlippagePercent === undefined ? "--" : `${maxSlippagePercent.toFixed(2)}%`;

  return (
    <div className={depositBreakdownBoxClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="m-0 text-sm text-prophet-muted">{t("transactionBreakdown")}</p>
        {poweredByLogoSrc ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-prophet-muted">{t("poweredBy")}</span>
            <img
              src={poweredByLogoSrc}
              alt={t("stableflowAlt")}
              className="h-4 w-auto object-contain"
            />
          </div>
        ) : null}
      </div>
      <div className={depositBreakdownRowClass}>
        <span>{t("networkCost")}</span>
        <span>{loading ? (<Loader2 className="h-4 w-4 animate-spin" />) : networkDisplay}</span>
      </div>
      <div className={depositBreakdownRowClass}>
        <span>{t("priceImpact")}</span>
        <span>{loading ? (<Loader2 className="h-4 w-4 animate-spin" />) : priceImpactDisplay}</span>
      </div>
      <div className={depositBreakdownRowClass}>
        <span>{t("maxSlippage")}</span>
        <span>{loading ? (<Loader2 className="h-4 w-4 animate-spin" />) : slippageDisplay}</span>
      </div>
    </div>
  );
}
