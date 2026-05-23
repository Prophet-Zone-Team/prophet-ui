"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { FundingAsset, POLYMARKET_USD } from "@/config/funding";
import {
  depositAmountInputClass,
  depositPercentButtonClass,
  depositTransferBarClass
} from "@/views/portfolio/deposit/deposit-ui";
import {
  applyBalancePercent,
  parseAmountInput,
  validateDepositAmount
} from "@/views/portfolio/deposit/utils";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import Big from "big.js";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

export interface DepositAmountStepProps {
  token: FundingAsset;
  amount: string;
  maxAmount: string;
  onAmountChange: (amount: string) => void;
}

export function DepositAmountStep({
  token,
  amount,
  maxAmount,
  onAmountChange
}: DepositAmountStepProps) {
  const [inputValue, setInputValue] = useState(() =>
    Big(amount || 0).gt(0) ? amount : "0"
  );

  const validationError = useMemo(
    () => validateDepositAmount(parseAmountInput(inputValue), maxAmount),
    [inputValue, maxAmount]
  );

  function handleInputChange(nextRaw: string) {
    setInputValue(nextRaw);
    const parsed = parseAmountInput(nextRaw);

    if (parsed !== undefined) {
      onAmountChange(parsed);
    } else if (!nextRaw.trim()) {
      onAmountChange("0");
    }
  }

  function handlePercent(percent: number) {
    const next = applyBalancePercent(maxAmount, percent);
    setInputValue(next);
    onAmountChange(next);
  }

  return (
    <div className="flex flex-col gap-6 pb-2 pt-20">
      <div className="flex flex-col items-center gap-4">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          className={depositAmountInputClass}
          aria-label="Deposit amount"
          placeholder="0"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PERCENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              type="button"
              className={depositPercentButtonClass}
              onClick={() => handlePercent(percent)}
              disabled={Big(maxAmount).lte(0)}
            >
              {percent}%
            </button>
          ))}
        </div>
        {validationError ? (
          <p className="m-0 text-sm text-prophet-red">{validationError}</p>
        ) : null}
      </div>

      <div className="mt-20">
        <div className="flex justify-between items-center gap-1 px-4 py-3">
          <span className="text-sm font-[556] text-[#909090]">Send</span>
          <span className="text-sm font-[556] text-[#909090]">Receive</span>
        </div>
        <div className={depositTransferBarClass}>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <TokenIcon
                symbol={token.symbol}
                chainLabel={token.chainName}
                icon={token.icon}
                chainIcon={token.chainIcon}
                size="md"
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-[556] text-black">{token.symbol}</span>
                <span className="text-xs font-[556] text-[#909090]">{token.chainName}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-[#909090]" aria-hidden="true" />

          <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-col items-end">
                <span className="text-sm font-[556] text-black">
                  {POLYMARKET_USD.symbol}
                </span>
                <span className="text-xs font-[556] text-[#909090]">
                  {POLYMARKET_USD.chainName}
                </span>
              </div>
              <TokenIcon
                symbol="USDC"
                chainLabel={POLYMARKET_USD.chainName}
                icon={POLYMARKET_USD.icon}
                chainIcon={POLYMARKET_USD.chainIcon}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function isDepositAmountValid(
  amount: string,
  maxAmount: string
): boolean {
  return validateDepositAmount(amount, maxAmount) === undefined;
}
