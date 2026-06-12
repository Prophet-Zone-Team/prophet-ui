"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Big from "big.js";

import { POLYMARKET_USD } from "@/config/funding";
import { formatShortWallet } from "@/lib/team/detail-format";
import { usePricesStore } from "@/store/use-prices";
import { formatNumber } from "@/utils";
import {
  depositPercentButtonClass,
  depositTransferBarClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { usePrivateTopupContext } from "@/views/portfolio/private-topup/context";
import type {
  PrivateTopupAmountState,
  PrivateTopupSelectableToken,
} from "@/views/portfolio/private-topup/types";
import {
  privateTopupModalAmountInputClass,
  privateTopupModalAmountInputWrapClass,
  privateTopupModalAmountPrefixClass,
  privateTopupSecureIconWrapClass,
} from "@/views/portfolio/private-topup/private-topup-ui";
import {
  applyTokenBalancePercent,
  computeUsdFromTokenAmount,
  parseUsdInput,
  selectTokenUnitPrice,
  validatePrivateTopupAmount,
} from "@/views/portfolio/private-topup/utils";
import { cn } from "@/lib/cn";
import InputNumber from "@/components/input-number";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

export interface PrivateTopupAmountStepProps {
  token: PrivateTopupSelectableToken;
  amount: PrivateTopupAmountState;
  maxAmount: string;
  onAmountChange: (amount: PrivateTopupAmountState) => void;
}

export function PrivateTopupAmountStep({
  token,
  amount,
  maxAmount,
  onAmountChange,
}: PrivateTopupAmountStepProps) {
  const t = useTranslations("privateTopup");
  const { topupWalletAddress, privateAccountAddress } = usePrivateTopupContext();
  const prices = usePricesStore((state) => state.prices);

  const [inputValue, setInputValue] = useState("0");

  const validationErrorKey = useMemo(
    () => validatePrivateTopupAmount(amount.tokenAmount, maxAmount),
    [amount.tokenAmount, maxAmount],
  );

  const unitPrice = selectTokenUnitPrice(prices, token);

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

    let tokenAmount = Big(parsedUsd)
      .div(unitPrice)
      .toFixed(token.decimals, Big.roundDown);

    if (Big(tokenAmount).gt(maxAmount || 0)) {
      tokenAmount = applyTokenBalancePercent(maxAmount, 100, token.decimals);
    }

    const amountUsd = computeUsdFromTokenAmount(tokenAmount, prices, token);
    onAmountChange({ tokenAmount, amountUsd });
  }

  function handlePercent(percent: number) {
    const tokenAmount = applyTokenBalancePercent(
      maxAmount,
      percent,
      token.decimals,
    );
    syncFromTokenAmount(tokenAmount);
  }

  return (
    <div className="flex flex-col justify-between gap-6 pb-2 pt-8 h-full">
      <div className="flex flex-col items-center gap-4">
        <div className={privateTopupModalAmountInputWrapClass}>
          <InputNumber
            prefix="$"
            value={inputValue}
            onNumberChange={handleInputChange}
            className={privateTopupModalAmountInputClass}
            aria-label={t("topUpAmountAria")}
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
        {validationErrorKey ? (
          <p className="m-0 text-sm text-prophet-red">{t(validationErrorKey)}</p>
        ) : null}
      </div>

      <div className={cn(depositTransferBarClass, "mt-[3.5rem]")}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-[400] text-[#909090]">
            {t("fundingWallet")}
          </span>
          <div className="flex items-center gap-2">
            <WalletAvatarIcon address={topupWalletAddress} className="size-5" />
            <span className="truncate text-base font-[500] text-black">
              {topupWalletAddress
                ? formatShortWallet(topupWalletAddress)
                : "--"}
            </span>
          </div>
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
          <span className="text-sm font-[400] text-[#909090]">
            {t("privateWallet")}
          </span>
          <div className="flex items-center gap-2">
            <div className={privateTopupSecureIconWrapClass}>
              <img
                src="/icons/icon-secure.svg"
                alt=""
                className="size-3 object-contain"
                aria-hidden
              />
            </div>
            <span className="truncate text-base font-[500] text-black">
              {privateAccountAddress
                ? formatShortWallet(privateAccountAddress)
                : "--"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TokenIcon
              symbol="USDC"
              chainLabel={POLYMARKET_USD.chainName}
              icon={POLYMARKET_USD.icon}
              chainIcon={POLYMARKET_USD.chainIcon}
              size="md"
            />
            <div className="flex min-w-0 flex-col items-start">
              <span className="text-sm font-[500] text-black">
                {POLYMARKET_USD.symbol}
              </span>
              <span className="text-xs font-[500] text-[#909090]">
                {POLYMARKET_USD.chainName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function isPrivateTopupAmountStepValid(
  tokenAmount: string,
  maxAmount: string,
): boolean {
  return validatePrivateTopupAmount(tokenAmount, maxAmount) === undefined;
}
