"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { DEPOSIT_RECEIVE_ASSET } from "@/views/portfolio/deposit/config";
import {
  depositAmountInputClass,
  depositPercentButtonClass,
  depositTransferBarClass
} from "@/views/portfolio/deposit/deposit-ui";
import {
  applyBalancePercent,
  formatAmountInputValue,
  parseAmountInput,
  validateDepositAmount
} from "@/views/portfolio/deposit/utils";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import { FundingAsset } from "@/config/funding";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

export interface DepositAmountStepProps {
  token: FundingAsset;
  amount: number;
  onAmountChange: (amount: number) => void;
}

export function DepositAmountStep({
  token,
  amount,
  onAmountChange
}: DepositAmountStepProps) {
  const [inputValue, setInputValue] = useState(() =>
    amount > 0 ? formatAmountInputValue(amount) : formatAmountInputValue(0)
  );

  const validationError = useMemo(
    () => validateDepositAmount(parseAmountInput(inputValue), 0),
    [inputValue]
  );

  function handleInputChange(nextRaw: string) {
    setInputValue(nextRaw);
    const parsed = parseAmountInput(nextRaw);

    if (parsed !== undefined) {
      onAmountChange(parsed);
    } else if (!nextRaw.trim()) {
      onAmountChange(0);
    }
  }

  function handlePercent(percent: number) {
    const next = applyBalancePercent(0, percent);
    setInputValue(formatAmountInputValue(next));
    onAmountChange(next);
  }

  return (
    <div className="flex flex-col gap-6 pb-2">
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
            >
              {percent}%
            </button>
          ))}
        </div>
        {validationError ? (
          <p className="m-0 text-sm text-prophet-red">{validationError}</p>
        ) : null}
      </div>

      <div className={depositTransferBarClass}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-[556] text-[#909090]">Send</span>
          <div className="flex items-center gap-2">
            <TokenIcon symbol={token.symbol} chainLabel={token.chainName} size="md" />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-[556] text-black">{token.symbol}</span>
              <span className="text-xs font-[556] text-[#909090]">{token.chainName}</span>
            </div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-[#909090]" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
          <span className="text-sm font-[556] text-[#909090]">Receive</span>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-col items-end">
              <span className="text-sm font-[556] text-black">
                {DEPOSIT_RECEIVE_ASSET.symbol}
              </span>
              <span className="text-xs font-[556] text-[#909090]">
                {DEPOSIT_RECEIVE_ASSET.chainLabel}
              </span>
            </div>
            <TokenIcon symbol="USDC" chainLabel={DEPOSIT_RECEIVE_ASSET.chainLabel} size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function isDepositAmountValid(
  amount: number,
  maxAmount: number
): boolean {
  return validateDepositAmount(amount, maxAmount) === undefined;
}
