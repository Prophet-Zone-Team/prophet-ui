"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  isCopyTransferDepositFailure,
  isCopyTransferDepositSuccess
} from "@/lib/copy-trade/transfer-deposit";
import { formatLongText, formatNumber } from "@/utils";
import type { CopyTransferDeposit } from "@/types/copy-trade-funding";

export interface DepositTransferStatusStepProps {
  txHash: string;
  record: CopyTransferDeposit | null;
  loading?: boolean;
  errorText?: string;
}

const cardClass = cn(
  "flex flex-col gap-1 rounded-[8px] border border-prophet-line bg-prophet-action-panel px-4 py-3"
);

function resolveStatusMessageKey(
  status: string | undefined
): string | undefined {
  switch (status) {
    case "submitted":
      return "transferDepositStatusSubmitted";
    case "waiting_confirmations":
      return "transferDepositStatusWaitingConfirmations";
    case "tx_not_found_retry":
      return "transferDepositStatusTxNotFound";
    case "rpc_retry":
      return "transferDepositStatusRpcRetry";
    case "credited":
      return "transferDepositCredited";
    case "invalid":
    case "ambiguous":
      return "transferDepositFailed";
    default:
      return undefined;
  }
}

export function DepositTransferStatusStep({
  txHash,
  record,
  loading = false,
  errorText
}: DepositTransferStatusStepProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const status = record?.status;
  const statusKey = resolveStatusMessageKey(status);
  const isSuccess = isCopyTransferDepositSuccess(status);
  const isFailure = isCopyTransferDepositFailure(status);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            isSuccess
              ? "bg-[#65AF14]/15"
              : isFailure
                ? "bg-red-500/10"
                : "bg-[#65AF14]/15"
          )}
        >
          {isSuccess ? (
            <span className="size-3 rounded-full bg-[#65AF14]" />
          ) : isFailure ? (
            <span className="size-3 rounded-full bg-red-500" />
          ) : (
            <span className="size-3 animate-ping rounded-full bg-[#65AF14]" />
          )}
        </div>
        <span className="text-lg font-[600] text-prophet-foreground">
          {isSuccess
            ? t("transferDepositCreditedTitle")
            : isFailure
              ? t("transferDepositFailedTitle")
              : t("transferSubmittedTitle")}
        </span>
        <span className="text-sm text-prophet-muted">
          {statusKey
            ? t(statusKey)
            : loading
              ? t("transferDepositProcessing")
              : t("polymarketTransferStatusDescription")}
        </span>
      </div>

      <div className={cardClass}>
        {txHash ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-prophet-muted">
              {t("transaction")}
            </span>
            <span className="text-sm font-[500] text-prophet-foreground">
              {formatLongText(txHash, 6, 4)}
            </span>
          </div>
        ) : null}
        {record?.confirmations != null && record.confirmations > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-prophet-muted">
              {t("transferDepositConfirmations")}
            </span>
            <span className="text-sm font-[500] text-prophet-foreground">
              {record.confirmations}
            </span>
          </div>
        ) : null}
        {isSuccess && record ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-prophet-muted">
              {t("creditedSoFar")}
            </span>
            <span className="text-sm font-[600] text-[#65AF14]">
              {formatNumber(record.amount_pusd, 2, true, { round: 0 })} pUSD
            </span>
          </div>
        ) : null}
      </div>

      {errorText || record?.error ? (
        <p className="text-center text-sm text-red-500">
          {errorText || record?.error}
        </p>
      ) : null}
    </div>
  );
}
