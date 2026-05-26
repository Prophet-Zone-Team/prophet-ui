"use client";

import { Loader2 } from "lucide-react";

import { formatShortWallet } from "@/lib/team/detail-format";
import {
  depositConnectedRowClass,
  depositSectionLabelClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { usePortfolioContext } from "../context";
import { getStoredTradingWalletInfo } from "@/components/trading/trading-wallet-session";
import { formatNumber } from "@/utils";
import { useEffect } from "react";

export interface WithdrawEntryStepProps {
  onSelectBridge: () => void;
  onSelectStableflow: () => void;
  stableflowLoading?: boolean;
}

export function WithdrawEntryStep({
  onSelectBridge,
  onSelectStableflow,
  stableflowLoading = false,
}: WithdrawEntryStepProps) {
  const { session, onConnectWallet, status, portfolio, reload, coreStatus } = usePortfolioContext();
  const availableDisplay = session
    ? formatNumber(portfolio?.availableToTrade, 4, true, {
      round: 0,
      isZeroPrecision: true
    })
    : "0.00";

  useEffect(() => {
    reload();
  }, []);

  if (!session) {
    return (
      <div className="flex justify-center gap-3 pb-2 pt-[120px]">
        <button
          type="button"
          className="bg-black text-white flex justify-center items-center w-60 h-10 text-base rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void onConnectWallet()}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-2">
      <span className={depositSectionLabelClass}>Connected</span>
      <button type="button" className={depositConnectedRowClass} onClick={onSelectBridge}>
        <span className="flex min-w-0 items-center gap-3">
          <WalletAvatarIcon address={session?.walletAddress} />
          <span className="truncate text-base font-[556] text-black">
            {formatShortWallet(session.walletAddress)}
          </span>
        </span>
        <span className="shrink-0 text-base font-[556] text-[#909090]">
          {
            coreStatus === "loading"
              ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#909090]" aria-hidden="true" />
              )
              : availableDisplay
          }
        </span>
      </button>

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
            <img
              src="/logos/logo-stableflow.svg"
              alt=""
              className="size-8 shrink-0 rounded-full object-center object-contain"
            />
          )}
          <span className="truncate text-base font-[556] text-black">Stableflow</span>
        </span>
      </button>
    </div>
  );
}
