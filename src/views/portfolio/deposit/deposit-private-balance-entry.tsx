"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Big from "big.js";
import { useMemo, useState } from "react";

import InputNumber from "@/components/input-number";
import { POLYMARKET_USD } from "@/config/funding";
import { cn } from "@/lib/cn";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import {
  depositModalAmountInputClass,
  depositModalAmountInputWrapClass,
  depositPercentButtonClass,
  depositPrivateAccountRowClass,
  depositPrivatePanelDisabledClass,
  depositPrivateTopUpLinkClass,
  depositSectionLabelClass,
  depositTransferBarClass
} from "@/views/portfolio/deposit/deposit-ui";
import type { PrivateAccountStatus } from "@/views/portfolio/deposit/types";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

const USDC_TOKEN = POLYMARKET_USD.underlyingToken;

export interface DepositPrivateBalanceEntryProps {
  status: PrivateAccountStatus;
  privateAccountAddress?: string;
  privateBalanceUsd?: number;
  onTopUp?: () => void;
}

export function DepositPrivateBalanceEntry({
  status,
  privateAccountAddress,
  privateBalanceUsd,
  onTopUp
}: DepositPrivateBalanceEntryProps) {
  const [inputValue, setInputValue] = useState("0");

  const isInteractive = status === "funded";
  const maxBalanceUsd = privateBalanceUsd ?? 0;

  const formattedAccountBalance = useMemo(
    () =>
      formatNumber(privateBalanceUsd ?? 0, 2, true, {
        round: 0,
        isZeroPrecision: true
      }),
    [privateBalanceUsd]
  );

  function handlePercent(percent: number) {
    if (!isInteractive || maxBalanceUsd <= 0) {
      return;
    }

    const nextAmount = Big(maxBalanceUsd).times(percent).div(100);
    setInputValue(nextAmount.toFixed(2, Big.roundDown));
  }

  const transferEnabled =
    isInteractive && Big(inputValue || 0).gt(0) && maxBalanceUsd > 0;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <span className={depositSectionLabelClass}>Private Account</span>
        {status !== "not_created" ? (
          <button
            type="button"
            className={depositPrivateTopUpLinkClass}
            onClick={() => onTopUp?.()}
          >
            Top up
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className={depositPrivateAccountRowClass}>
        {status === "not_created" ? (
          <span className="flex min-w-0 items-center gap-3">
            <div className="size-[30px] border-[4px] rounded-full border-white bg-[#616161] shadow-[0_0_4px_0px_rgba(0,0,0,0.25)] shrink-0 flex justify-center items-center">
              <img
                src="/icons/icon-secure.svg"
                alt=""
                className="size-[13px] shrink-0 object-center object-contain"
                aria-hidden="true"
              />
            </div>

            <span className="text-base font-[500] text-black">Not Created</span>
          </span>
        ) : (
          <>
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#616161] ring-2 ring-[#f4f4f4]">
                <img
                  src="/icons/icon-secure.svg"
                  alt=""
                  className="size-3.5 object-contain"
                  aria-hidden="true"
                />
              </span>
              <span className="truncate text-base font-[500] text-black">
                {privateAccountAddress
                  ? formatShortWallet(privateAccountAddress)
                  : "—"}
              </span>
            </span>
            <span className="shrink-0 text-base font-[500] text-black">
              {formattedAccountBalance}
            </span>
          </>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-4 pt-2",
          !isInteractive && depositPrivatePanelDisabledClass
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={depositModalAmountInputWrapClass}>
            <InputNumber
              prefix="$"
              value={inputValue}
              onNumberChange={setInputValue}
              className={depositModalAmountInputClass}
              aria-label="Private balance transfer amount in USD"
              placeholder="0"
              disabled={!isInteractive}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PERCENT_OPTIONS.map((percent) => (
              <button
                key={percent}
                type="button"
                className={depositPercentButtonClass}
                onClick={() => handlePercent(percent)}
                disabled={!isInteractive || maxBalanceUsd <= 0}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-1 px-4 py-3">
            <span className="text-sm font-[500] text-[#909090]">From</span>
            <span className="text-sm font-[500] text-[#909090]">To</span>
          </div>
          <div className={depositTransferBarClass}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative shrink-0">
                <TokenIcon
                  symbol="USDC"
                  chainLabel="Private"
                  icon={USDC_TOKEN.icon}
                  size="md"
                />
                <img
                  src="/icons/icon-secure.svg"
                  alt=""
                  className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border border-white bg-[#616161] p-0.5"
                  aria-hidden="true"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-[500] text-black">USDC</span>
                <span className="text-xs font-[500] text-[#909090]">
                  Private
                </span>
              </div>
            </div>

            <ArrowRight
              className="h-4 w-4 shrink-0 text-[#909090]"
              aria-hidden="true"
            />

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="flex min-w-0 flex-col items-end">
                <span className="text-sm font-[500] text-black">USDC</span>
                <span className="text-xs font-[500] text-[#909090]">
                  Prophet
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

        <button
          type="button"
          className={cn(
            fundingPrimaryButtonClass,
            !transferEnabled && "opacity-30"
          )}
          disabled={!transferEnabled}
        >
          Transfer
        </button>
      </div>
    </div>
  );
}
