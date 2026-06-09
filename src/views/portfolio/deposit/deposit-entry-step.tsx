"use client";

import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/auth";
import { formatNumber } from "@/utils";
import { DepositPrivateBalanceEntry } from "@/views/portfolio/deposit/deposit-private-balance-entry";
import { DepositSourceTabs } from "@/views/portfolio/deposit/deposit-source-tabs";
import { resolvePrivateAccountStatus } from "@/views/portfolio/deposit/resolve-private-account-status";
import type { DepositEntryTab } from "@/views/portfolio/deposit/types";
import { useDepositContext } from "@/views/portfolio/deposit/context";
import { FundingCryptoEntry } from "@/views/portfolio/shared/funding-crypto-entry";

export interface DepositEntryStepProps {
  entryTab: DepositEntryTab;
  onEntryTabChange: (tab: DepositEntryTab) => void;
  onSelectConnected: () => void;
  onSelectStableflow: () => void;
  stableflowLoading?: boolean;
}

export function DepositEntryStep({
  entryTab,
  onEntryTabChange,
  onSelectConnected,
  onSelectStableflow,
  stableflowLoading = false,
}: DepositEntryStepProps) {
  const { session, openLogin, loginInProgress } = useAuth();
  const { connectedWalletBalanceUsd, balancesLoading, pricesLoading } =
    useDepositContext();

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
  const privateAccountStatus = resolvePrivateAccountStatus(session);

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-10 md:pb-2">
      <DepositSourceTabs value={entryTab} onChange={onEntryTabChange} />

      {entryTab === "crypto" ? (
        <FundingCryptoEntry
          reference="deposit"
          walletAddress={session.walletAddress}
          connectedBalance={
            isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#909090]" aria-hidden="true" />
            ) : (
              formatNumber(connectedWalletBalanceUsd, 2, true, {
                round: 0,
                isZeroPrecision: true,
              })
            )
          }
          connectedBalanceClassName="text-black"
          onSelectConnected={onSelectConnected}
          onSelectStableflow={onSelectStableflow}
          stableflowLoading={stableflowLoading}
        />
      ) : null}

      {entryTab === "private_balance" ? (
        <DepositPrivateBalanceEntry
          status={privateAccountStatus}
          privateAccountAddress={session.privateAccountAddress}
        />
      ) : null}
    </div>
  );
}
