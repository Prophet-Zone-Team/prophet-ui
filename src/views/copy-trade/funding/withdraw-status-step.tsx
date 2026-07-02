"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatLongText, formatNumber } from "@/utils";
import type { CopyWithdrawal } from "@/types/copy-trade-funding";

export interface WithdrawStatusStepProps {
  withdrawal: CopyWithdrawal;
}

const cardClass = cn(
  "flex flex-col gap-1 rounded-[8px] border border-prophet-line bg-prophet-action-panel px-4 py-3",
);

export function WithdrawStatusStep({ withdrawal }: WithdrawStatusStepProps) {
  const t = useTranslations("copyTrade.funding.withdraw");
  const statusLabel = withdrawal.Status || t("statusSubmitted");

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#65AF14]/15">
          <span className="size-3 animate-ping rounded-full bg-[#65AF14]" />
        </div>
        <span className="text-lg font-[600] text-prophet-foreground">
          {t("withdrawalSubmittedTitle")}
        </span>
        <span className="text-sm text-prophet-muted">
          {t("processingDescription")}
        </span>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("amount")}</span>
          <span className="text-sm font-[600] text-prophet-foreground">
            {formatNumber(withdrawal.AmountPUSD, 2, true, { round: 0 })} pUSD
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("status")}</span>
          <span className="text-sm font-[500] text-prophet-foreground">{statusLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("recipient")}</span>
          <span className="text-sm font-[500] text-prophet-foreground">
            {formatLongText(withdrawal.RecipientAddress, 6, 4)}
          </span>
        </div>
        {withdrawal.TxHash ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-prophet-muted">{t("transaction")}</span>
            <span className="text-sm font-[500] text-prophet-foreground">
              {formatLongText(withdrawal.TxHash, 6, 4)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
