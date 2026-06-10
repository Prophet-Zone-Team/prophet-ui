"use client";

import { useState } from "react";

import { PolymarketAddressCopyButton } from "@/components/trading/polymarket-address-copy-button";
import { CopyIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import { PRIVATE_BALANCE_REFRESH_MS } from "@/views/portfolio/private-topup/config";
import {
  privateTopupAccountCardClass,
  privateTopupAccountInnerClass,
  privateTopupPrivateBalanceLargeClass,
  privateTopupSectionLabelClass,
  privateTopupSecureIconWrapClass,
  privateTopupTopUpButtonClass,
  privateTopupTopUpButtonDisabledClass,
} from "@/views/portfolio/private-topup/private-topup-ui";

export interface PrivateAccountCardProps {
  address?: string;
  privateBalanceUsd?: number;
  privateBalanceLoading?: boolean;
  topupWalletConnected: boolean;
  onRefresh?: () => void;
  onTopUp: () => void;
}

export function PrivateAccountCard({
  address,
  privateBalanceUsd = 0,
  privateBalanceLoading = false,
  topupWalletConnected,
  onRefresh,
  onTopUp,
}: PrivateAccountCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    onRefresh?.();
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), PRIVATE_BALANCE_REFRESH_MS);
  }

  return (
    <div className={privateTopupAccountCardClass}>
      <div className={privateTopupAccountInnerClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className={privateTopupSecureIconWrapClass}>
              <img
                src="/icons/icon-secure.svg"
                alt=""
                className="size-[26px] object-contain"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`m-0 ${privateTopupSectionLabelClass} text-[#909090]`}
              >
                Private Account
              </p>
              {address ? (
                <div className="mt-1 flex items-center gap-2">
                  <p className="m-0 truncate text-lg font-[500] text-white">
                    {formatShortWallet(address)}
                  </p>
                  <PolymarketAddressCopyButton
                    address={address}
                    ariaLabel="Copy private account address"
                    className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-white/70 transition-colors hover:text-white"
                  >
                    <CopyIcon />
                  </PolymarketAddressCopyButton>
                </div>
              ) : (
                <p className="m-0 mt-1 text-lg font-[500] text-white">-</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-80"
            aria-label="Refresh private balance"
            onClick={handleRefresh}
          >
            <img
              src="/icons/icon-refresh.svg"
              alt=""
              className={cn(
                "size-5 object-contain",
                refreshing && "animate-spin"
              )}
              aria-hidden
            />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <div>
            <p
              className={`m-0 ${privateTopupSectionLabelClass} text-[#909090]`}
            >
              Private Balance
            </p>
            <p
              className={cn(
                "m-0 mt-2",
                privateTopupPrivateBalanceLargeClass,
                !topupWalletConnected && "opacity-30"
              )}
            >
              {refreshing || privateBalanceLoading
                ? "…"
                : formatNumber(privateBalanceUsd, 2, true, {
                    prefix: "$",
                    round: 0,
                    isZeroPrecision: true
                  })}
            </p>
          </div>
          <button
            type="button"
            className={cn(
              privateTopupTopUpButtonClass,
              !topupWalletConnected && privateTopupTopUpButtonDisabledClass
            )}
            disabled={!topupWalletConnected}
            onClick={onTopUp}
          >
            Top up
          </button>
        </div>
      </div>
    </div>
  );
}
