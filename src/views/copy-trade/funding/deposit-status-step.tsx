"use client";

import { cn } from "@/lib/cn";
import { formatLongText, formatNumber } from "@/utils";
import type { CopyDepositStatusResult } from "@/types/copy-trade-funding";

export interface DepositStatusStepProps {
  txHash: string;
  status: CopyDepositStatusResult | null;
}

const cardClass = cn(
  "flex flex-col gap-1 rounded-[8px] border border-[#EBEBEB] bg-[#FAFBFC] px-4 py-3",
);

export function DepositStatusStep({ txHash, status }: DepositStatusStepProps) {
  const credited = status?.credited_pusd ?? 0;
  const transactions = status?.transactions ?? [];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#EAF6E0]">
          <span className="size-3 animate-ping rounded-full bg-[#65AF14]" />
        </div>
        <span className="text-lg font-[600] text-black">
          Transfer submitted
        </span>
        <span className="text-sm text-[#909090]">
          Your deposit is being bridged. This can take a few minutes.
        </span>
      </div>

      <div className={cardClass}>
        {txHash ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#909090]">Transaction</span>
            <span className="text-sm font-[500] text-black">
              {formatLongText(txHash, 6, 4)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#909090]">Credited so far</span>
          <span className="text-sm font-[600] text-black">
            {formatNumber(credited, 2, true, { round: 0 })} pUSD
          </span>
        </div>
      </div>

      {transactions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-[500] text-black">
            Bridge transactions
          </span>
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.tx_hash}
              className="flex items-center justify-between rounded-[6px] border border-[#EBEBEB] px-3 py-2"
            >
              <span className="text-xs text-[#909090]">
                {formatLongText(tx.tx_hash, 6, 4)}
              </span>
              <span
                className={cn(
                  "text-xs font-[500]",
                  tx.credited ? "text-[#65AF14]" : "text-[#909090]",
                )}
              >
                {tx.credited
                  ? `+${formatNumber(tx.amount_pusd, 2, true, { round: 0 })} pUSD`
                  : tx.status || "pending"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
