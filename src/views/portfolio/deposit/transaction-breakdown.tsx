"use client";

import { formatPortfolioMoney } from "@/lib/portfolio/portfolio-format";
import { MOCK_TRANSACTION_BREAKDOWN } from "@/views/portfolio/deposit/config";
import {
  depositBreakdownBoxClass,
  depositBreakdownRowClass
} from "@/views/portfolio/deposit/deposit-ui";

export function TransactionBreakdown() {
  const breakdown = MOCK_TRANSACTION_BREAKDOWN;

  return (
    <div className={depositBreakdownBoxClass}>
      <p className="m-0 mb-2 text-sm text-[#909090]">Transaction breakdown</p>
      <div className={depositBreakdownRowClass}>
        <span>Network cost</span>
        <span>{formatPortfolioMoney(breakdown.networkCost)}</span>
      </div>
      <div className={depositBreakdownRowClass}>
        <span>Price impact</span>
        <span>{breakdown.priceImpactPercent}%</span>
      </div>
      <div className={depositBreakdownRowClass}>
        <span>Max slippage</span>
        <span>{breakdown.maxSlippagePercent}%</span>
      </div>
    </div>
  );
}
