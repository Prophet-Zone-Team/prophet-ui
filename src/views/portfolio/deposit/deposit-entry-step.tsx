"use client";

import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/auth";
import { formatNumber } from "@/utils";
import { useConfidentialAccount } from "@/hooks/confidential/use-confidential-account";
import { useConfidentialBalance } from "@/hooks/confidential/use-confidential-balance";
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
  onOpenPrivateTopup?: () => void;
}

export function DepositEntryStep({
  entryTab,
  onEntryTabChange,
  onSelectConnected,
  onSelectStableflow,
  stableflowLoading = false,
  onOpenPrivateTopup,
}: DepositEntryStepProps) {
  const { session, openLogin, loginInProgress } = useAuth();
  const { connectedWalletBalanceUsd, balancesLoading, pricesLoading } =
    useDepositContext();
  const confidentialAccount = useConfidentialAccount();
  const confidentialBalance = useConfidentialBalance({
    enabled: confidentialAccount.authenticated,
  });

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
  const privateBalanceUsd = confidentialBalance.usdc?.usd;
  const privateAccountStatus = resolvePrivateAccountStatus(
    confidentialAccount.verified,
    privateBalanceUsd,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-10 md:pb-2">
      <DepositSourceTabs value={entryTab} onChange={onEntryTabChange} />

      {entryTab === "crypto" ? (
        <FundingCryptoEntry
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
          privateAccountAddress={confidentialAccount.intentsUserId}
          privateAccountEoaAddress={confidentialAccount.eoaAddress}
          privateBalanceUsd={privateBalanceUsd}
          walletAddress={session.walletAddress}
          onTopUp={onOpenPrivateTopup}
          onTransferred={() => void confidentialBalance.refetch()}
        />
      ) : null}
    </div>
  );
}
