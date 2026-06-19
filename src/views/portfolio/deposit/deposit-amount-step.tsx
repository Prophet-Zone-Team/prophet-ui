"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import Big from "big.js";
import { useTranslations } from "next-intl";

import InputNumber from "@/components/input-number";
import { POLYMARKET_USD } from "@/config/funding";
import { usePricesStore } from "@/store/use-prices";
import {
  depositModalAmountInputClass,
  depositModalAmountInputWrapClass,
  depositPercentButtonClass,
  depositFundingWalletChangeClass,
  depositTransferBarClass
} from "@/views/portfolio/deposit/deposit-ui";
import type {
  DepositAmountState,
  DepositSelectableToken
} from "@/views/portfolio/deposit/types";
import {
  applyTokenBalancePercent,
  computeUsdFromTokenAmount,
  parseUsdInput,
  selectDepositTokenUnitPrice,
  usdInputToTokenAmount,
  validateDepositAmount
} from "@/views/portfolio/deposit/utils";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

export interface DepositAmountStepProps {
  token: DepositSelectableToken;
  amount: DepositAmountState;
  maxAmount: string;
  minDepositUsd: number;
  onAmountChange: (amount: DepositAmountState) => void;
  showChangeWallet?: boolean;
  onChangeWallet?: () => void;
}

export function DepositAmountStep({
  token,
  amount,
  maxAmount,
  minDepositUsd,
  onAmountChange,
  showChangeWallet = false,
  onChangeWallet,
}: DepositAmountStepProps) {
  const t = useTranslations("portfolio.deposit");
  const tPrivateTopup = useTranslations("privateTopup");
  const prices = usePricesStore((state) => state.prices);

  const [inputValue, setInputValue] = useState(() =>
    Big(amount.amountUsd || 0).gt(0) ? amount.amountUsd : "0"
  );

  const validationErrorKey = useMemo(
    () =>
      validateDepositAmount(amount.tokenAmount, maxAmount, {
        minDepositUsd,
        amountUsd: amount.amountUsd
      }),
    [amount.amountUsd, amount.tokenAmount, maxAmount, minDepositUsd]
  );

  const validationError = validationErrorKey
    ? validationErrorKey === "amountBelowMinimum"
      ? t("amountBelowMinimum", { amount: `$${minDepositUsd}` })
      : t(validationErrorKey)
    : undefined;

  const unitPrice = selectDepositTokenUnitPrice(prices, token);

  function syncFromTokenAmount(tokenAmount: string) {
    const amountUsd = computeUsdFromTokenAmount(tokenAmount, prices, token);
    onAmountChange({ tokenAmount, amountUsd });
    setInputValue(amountUsd);
  }

  function handleInputChange(nextRaw: string) {
    setInputValue(nextRaw);
    const parsedUsd = parseUsdInput(nextRaw);

    if (parsedUsd === undefined) {
      if (!nextRaw.trim()) {
        onAmountChange({ tokenAmount: "0", amountUsd: "0" });
      }
      return;
    }

    if (!unitPrice || Big(unitPrice).lte(0)) {
      return;
    }

    const { tokenAmount, amountUsd } = usdInputToTokenAmount({
      usdInput: parsedUsd,
      maxAmount,
      price: unitPrice,
      decimals: token.decimals
    });

    onAmountChange({ tokenAmount, amountUsd });
  }

  function handlePercent(percent: number) {
    const tokenAmount = applyTokenBalancePercent(
      maxAmount,
      percent,
      token.decimals
    );
    syncFromTokenAmount(tokenAmount);
  }

  return (
    <div className="flex flex-col gap-6 pb-2 pt-20">
      <div className="flex flex-col items-center gap-4">
        <div className={depositModalAmountInputWrapClass}>
          <InputNumber
            prefix="$"
            value={inputValue}
            onNumberChange={handleInputChange}
            className={depositModalAmountInputClass}
            aria-label={t("amountAria")}
            placeholder="0"
          />
        </div>
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
        <div className="flex items-center justify-between gap-1 px-4 py-3">
          <span className="text-sm font-[500] text-[#909090]">{t("send")}</span>
          <span className="text-sm font-[500] text-[#909090]">{t("receive")}</span>
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
                <span className="text-sm font-[500] text-black">
                  {token.symbol}
                </span>
                <span className="text-xs font-[500] text-[#909090]">
                  {token.chainName}
                </span>
              </div>
            </div>
          </div>

          <ArrowRight
            className="h-4 w-4 shrink-0 text-[#909090]"
            aria-hidden="true"
          />

          <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-col items-end">
                <span className="text-sm font-[500] text-black">
                  {POLYMARKET_USD.symbol}
                </span>
                <span className="text-xs font-[500] text-[#909090]">
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

      {showChangeWallet && onChangeWallet ? (
        <div className="flex justify-center">
          <button
            type="button"
            className={depositFundingWalletChangeClass}
            onClick={onChangeWallet}
          >
            {tPrivateTopup("change")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
