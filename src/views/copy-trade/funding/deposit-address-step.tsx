"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { useDarkModeEnabled } from "@/store";
import { formatNumber } from "@/utils";
import type { CopyDepositStatusResult } from "@/types/copy-trade-funding";

export interface DepositAddressStepProps {
  address: string;
  loading: boolean;
  status: CopyDepositStatusResult | null;
}

const cardClass = cn(
  "flex flex-col gap-1 rounded-[8px] border border-prophet-line bg-prophet-action-panel px-4 py-3",
);

export function DepositAddressStep({
  address,
  loading,
  status,
}: DepositAddressStepProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const tPortfolioDeposit = useTranslations("portfolio.deposit");
  const darkModeEnabled = useDarkModeEnabled();

  const handleCopy = async () => {
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      toast.success(tPortfolioDeposit("addressCopied"));
    } catch {
      toast.error(tPortfolioDeposit("couldNotCopyAddress"));
    }
  };

  const recentTransactions = status?.transactions ?? [];

  return (
    <div className="relative flex flex-col gap-5 pb-2">
      <p className="text-sm leading-5 text-prophet-muted">
        {t("socialDepositDescription")}
      </p>

      <div className="flex justify-center">
        {loading || !address ? (
          <div
            className="size-[200px] animate-pulse rounded-[12px] bg-prophet-hover"
            aria-hidden="true"
          />
        ) : (
          <div className="rounded-[12px] border border-prophet-line p-3">
            <QRCodeSVG
              value={address}
              size={200}
              level="M"
              marginSize={2}
              bgColor={darkModeEnabled ? "#242427" : "#ffffff"}
              fgColor={darkModeEnabled ? "#ffffff" : "#000000"}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-[500] text-prophet-foreground">
          {tPortfolioDeposit("yourDepositAddress")}
        </span>
        <div className="flex items-center justify-between gap-3 rounded-[6px] border border-prophet-line bg-prophet-panel px-4 py-3">
          {loading || !address ? (
            <div
              className="h-4 w-full animate-pulse rounded bg-prophet-hover"
              aria-hidden="true"
            />
          ) : (
            <p className="min-w-0 flex-1 break-all text-sm font-[500] text-prophet-foreground">
              {address}
            </p>
          )}
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 border-0 bg-transparent p-0 text-sm font-[500] text-[#3168FF] hover:opacity-80 disabled:opacity-50"
            disabled={loading || !address}
            onClick={() => void handleCopy()}
          >
            <img
              src="/icons/icon-copy.svg"
              alt=""
              className="size-3 shrink-0"
              aria-hidden="true"
            />
            {t("copy")}
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("creditedSoFar")}</span>
          <span className="text-sm font-[600] text-prophet-foreground">
            {formatNumber(status?.credited_pusd ?? 0, 2, true, { round: 0 })} pUSD
          </span>
        </div>
        <span className="text-xs text-prophet-muted">
          {recentTransactions.length > 0
            ? t("bridgeTransactionsDetected", {
                count: recentTransactions.length,
              })
            : t("waitingForTransfer")}
        </span>
      </div>
    </div>
  );
}
