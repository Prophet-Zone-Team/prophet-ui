"use client";

import { Loader2 } from "lucide-react";

import { formatShortWallet } from "@/lib/team/detail-format";
import {
  depositConnectedRowClass,
  depositSectionLabelClass
} from "@/views/portfolio/deposit/deposit-ui";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { useAuth } from "@/context/auth";
import { useDepositContext } from "./context";
import { formatNumber } from "@/utils";

export interface DepositEntryStepProps {
  onSelectConnected: () => void;
  onSelectStableflow: () => void;
  stableflowLoading?: boolean;
}

export function DepositEntryStep({
  onSelectConnected,
  onSelectStableflow,
  stableflowLoading = false,
}: DepositEntryStepProps) {
  const { session, openLogin, loginInProgress } = useAuth();
  const {
    connectedWalletBalanceUsd,
    stableflowBalanceUsd,
    balancesLoading,
    pricesLoading,
  } = useDepositContext();

  if (!session) {
    return (
      <div className="flex justify-center gap-3 pb-2 pt-[120px]">
        <button
          type="button"
          className="bg-black text-white flex justify-center items-center w-60 h-10 text-base rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void openLogin()}
          disabled={loginInProgress}
        >
          {loginInProgress ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  const isLoading = balancesLoading || pricesLoading;

  return (
    <div className="flex flex-col gap-3 pb-2">
      <span className={depositSectionLabelClass}>Stableflow</span>
      <button
        type="button"
        className={depositConnectedRowClass}
        onClick={() => void onSelectStableflow()}
        disabled={stableflowLoading}
      >
        <span className="flex min-w-0 items-center gap-3">
          {stableflowLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#909090]" aria-hidden="true" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f4] text-xs font-[556] text-black">
              SF
            </span>
          )}
          <span className="truncate text-base font-[556] text-black">Stableflow</span>
        </span>
        <span className="shrink-0 text-base font-[556] text-black">
        </span>
      </button>

      <span className={depositSectionLabelClass}>Connected</span>
      <button
        type="button"
        className={depositConnectedRowClass}
        onClick={onSelectConnected}
      >
        <span className="flex min-w-0 items-center gap-3">
          <WalletAvatarIcon />
          <span className="truncate text-base font-[556] text-black">
            {formatShortWallet(session.walletAddress)}
          </span>
        </span>
        <span className="shrink-0 text-base font-[556] text-black">
          {
            isLoading
              ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#909090]" aria-hidden="true" />
              )
              : formatNumber(connectedWalletBalanceUsd, 2, true, { round: 0, isZeroPrecision: true })
          }
        </span>
      </button>
    </div>
  );
}
