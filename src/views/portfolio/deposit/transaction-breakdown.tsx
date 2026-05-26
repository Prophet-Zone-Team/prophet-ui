"use client";

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
        <p className="m-0 text-sm text-[#909090]">Transaction breakdown</p>
        {poweredByLogoSrc ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-[#909090]">Powered by</span>
            <img
              src={poweredByLogoSrc}
              alt="Stableflow"
              className="h-4 w-auto object-contain"
            />
          </div>
        ) : null}
      </div>
      <div className={depositBreakdownRowClass}>
        <span>Network cost</span>
        <span>{networkDisplay}</span>
      </div>
      <div className={depositBreakdownRowClass}>
        <span>Price impact</span>
        <span>{priceImpactDisplay}</span>
      </div>
      <div className={depositBreakdownRowClass}>
        <span>Max slippage</span>
        <span>{slippageDisplay}</span>
      </div>
    </div>
  );
}
