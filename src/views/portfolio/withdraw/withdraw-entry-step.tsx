"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { usePortfolioContext } from "../context";
import { formatNumber } from "@/utils";
import { FundingCryptoEntry } from "@/views/portfolio/shared/funding-crypto-entry";

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
  const t = useTranslations("portfolio");
  const { session, onConnectWallet, status, portfolio, reload, coreStatus } =
    usePortfolioContext();
  const availableDisplay = session
    ? formatNumber(portfolio?.availableToTrade, 4, true, {
        round: 0,
        isZeroPrecision: true,
      })
    : "0.00";

  useEffect(() => {
    reload();
  }, [reload]);

  if (!session) {
    return (
      <div className="flex justify-center gap-3 pb-2 pt-[120px]">
        <button
          type="button"
          className="bg-black dark:bg-prophet-primary text-white flex justify-center items-center w-60 h-10 text-base rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void onConnectWallet()}
          disabled={status === "loading"}
        >
          {status === "loading" ? t("connecting") : t("connectWallet")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-10 md:pb-2">
      <FundingCryptoEntry
        reference="withdraw"
        walletAddress={session.walletAddress}
        connectedBalance={
          coreStatus === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-prophet-muted" aria-hidden="true" />
          ) : (
            availableDisplay
          )
        }
        connectedBalanceClassName="text-prophet-muted"
        onSelectConnected={onSelectBridge}
        onSelectStableflow={onSelectStableflow}
        stableflowLoading={stableflowLoading}
      />
    </div>
  );
}
