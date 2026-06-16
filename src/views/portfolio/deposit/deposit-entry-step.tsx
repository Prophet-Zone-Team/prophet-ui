"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { useMigrate } from "@/context/migrate";
import { formatNumber } from "@/utils";
import { depositPendingConfirmButtonClass } from "@/views/portfolio/deposit/deposit-ui";
import { DepositPrivateBalanceEntry } from "@/views/portfolio/deposit/deposit-private-balance-entry";
import { DepositSourceTabs } from "@/views/portfolio/deposit/deposit-source-tabs";
import { resolvePrivateAccountStatus } from "@/views/portfolio/deposit/resolve-private-account-status";
import type { DepositEntryTab } from "@/views/portfolio/deposit/types";
import { useDepositContext } from "@/views/portfolio/deposit/context";
import { FundingCryptoEntry } from "@/views/portfolio/shared/funding-crypto-entry";
import { MigrateDepositEntry } from "@/views/portfolio/migrate";

export interface DepositEntryStepProps {
  entryTab: DepositEntryTab;
  onEntryTabChange: (tab: DepositEntryTab) => void;
  onSelectConnected: () => void;
  onSelectStableflow: () => void;
  stableflowLoading?: boolean;
  onOpenPrivateTopup?: () => void;
  onClose?: () => void;
}

export function DepositEntryStep({
  entryTab,
  onEntryTabChange,
  onSelectConnected,
  onSelectStableflow,
  stableflowLoading = false,
  onOpenPrivateTopup,
  onClose,
}: DepositEntryStepProps) {
  const t = useTranslations("portfolio");
  const {
    session,
    openLogin,
    loginInProgress,
    isBuyRestricted,
    privateBalance,
    privateBalanceStatus,
    refreshPrivateBalance,
    confidentialAccount,
  } = useAuth();
  const {
    connectedWalletBalanceUsd,
    balancesLoading,
    pricesLoading,
    hasPendingDeposit,
    converting,
    onConfirmPendingDeposit,
  } = useDepositContext();
  const { openMigrateDialog } = useMigrate();
  const regionRestricted = Boolean(isBuyRestricted);

  useEffect(() => {
    if (confidentialAccount.authenticated && privateBalanceStatus === "idle") {
      void refreshPrivateBalance();
    }
  }, [confidentialAccount.authenticated, privateBalanceStatus, refreshPrivateBalance]);

  if (!session) {
    return (
      <div className="flex justify-center gap-3 pb-2 pt-[120px]">
        <button
          type="button"
          className="bg-black text-white flex justify-center items-center w-60 h-10 text-base rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void openLogin()}
          disabled={loginInProgress}
        >
          {loginInProgress ? t("connecting") : t("connectWallet")}
        </button>
      </div>
    );
  }

  const isLoading = balancesLoading || pricesLoading;
  const privateBalanceUsd = privateBalance?.usd;
  const privateAccountStatus = resolvePrivateAccountStatus(
    confidentialAccount.verified,
    privateBalanceUsd,
  );

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
                isLessPrecision: false,
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
        />
      ) : null}

      <MigrateDepositEntry
        onOpen={() => {
          openMigrateDialog("setup")
          onClose?.();
        }}
      />

      {(hasPendingDeposit && entryTab === "crypto") ? (
        <RegionRestrictedControl restricted={regionRestricted}>
          <button
            type="button"
            className={depositPendingConfirmButtonClass}
            disabled={converting || regionRestricted}
            onClick={() => void onConfirmPendingDeposit()}
          >
            {converting ? (
              <Loader2
                className="mr-1.5 h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {t("confirmPendingDeposit")}
          </button>
        </RegionRestrictedControl>
      ) : null}
    </div>
  );
}
