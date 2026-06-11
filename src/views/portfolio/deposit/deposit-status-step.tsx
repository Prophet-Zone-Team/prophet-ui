"use client";

import type { OneClickStatus } from "@stableflow/core";
import Big from "big.js";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatShortWallet } from "@/lib/team/detail-format";
import type { PendingDepositConvertMode } from "@/lib/trading/deposit-wallet-convert";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import type { DepositStatusPhase } from "@/views/portfolio/deposit/types";
import { formatNumber } from "@/utils";

export interface DepositStatusStepProps {
  phase: DepositStatusPhase;
  funderAddress: string;
  pendingConvertMode?: PendingDepositConvertMode | null;
  detectedUsdcAmount?: string;
  detectedUsdceAmount?: string;
  bridgeStatusLabel?: string;
  convertStatusLabel?: string;
  error?: string;
  convertLoading?: boolean;
  onConfirmConvert?: () => void;
}

export function DepositStatusStep({
  phase,
  funderAddress,
  pendingConvertMode,
  detectedUsdcAmount,
  detectedUsdceAmount,
  bridgeStatusLabel,
  convertStatusLabel,
  error,
  convertLoading = false,
  onConfirmConvert
}: DepositStatusStepProps) {
  const tDeposit = useTranslations("portfolio.deposit");
  const tPortfolio = useTranslations("portfolio");
  const isWrapOnly = pendingConvertMode === "wrap-only";

  const readyTitle = isWrapOnly
    ? tDeposit("statusUsdceReceived")
    : tDeposit("statusUsdcReceived");

  const readyDescription = (() => {
    if (isWrapOnly) {
      if (detectedUsdceAmount) {
        return tDeposit("statusUsdceReadyWithAmount", {
          amount: formatNumber(detectedUsdceAmount, 4, true, { round: 0 }),
        });
      }
      return tDeposit("statusUsdceReady");
    }

    if (detectedUsdcAmount) {
      return tDeposit("statusUsdcReadyWithAmount", {
        amount: formatNumber(detectedUsdcAmount, 4, true, { round: 0 }),
      });
    }
    return tDeposit("statusUsdcReady");
  })();

  const awaitingDetail = (() => {
    const parts: string[] = [];

    if (detectedUsdcAmount && Big(detectedUsdcAmount || 0).gt(0)) {
      parts.push(
        tDeposit("usdcDetected", {
          amount: formatNumber(detectedUsdcAmount, 4, true, { round: 0 }),
        })
      );
    }

    if (detectedUsdceAmount && Big(detectedUsdceAmount || 0).gt(0)) {
      parts.push(
        tDeposit("usdceDetected", {
          amount: formatNumber(detectedUsdceAmount, 4, true, { round: 0 }),
        })
      );
    }

    return parts.length > 0 ? parts.join(" · ") : undefined;
  })();

  return (
    <div className="flex flex-col gap-6 pb-2 pt-16">
      {phase === "bridging" ? (
        <StatusBlock
          title={tDeposit("statusBridgingTitle")}
          description={tDeposit("statusBridgingDescription")}
          detail={bridgeStatusLabel}
          loading
        />
      ) : null}

      {phase === "awaiting_funds" ? (
        <StatusBlock
          title={tDeposit("statusAwaitingTitle")}
          description={tDeposit("statusAwaitingDescription", {
            address: formatShortWallet(funderAddress),
          })}
          detail={awaitingDetail}
          loading
        />
      ) : null}

      {phase === "ready" ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="m-0 text-xl font-[500] text-black">{readyTitle}</p>
          <p className="m-0 max-w-sm text-sm text-[#909090]">
            {readyDescription}
          </p>
          <button
            type="button"
            className={fundingPrimaryButtonClass}
            disabled={convertLoading}
            onClick={() => void onConfirmConvert?.()}
          >
            {convertLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {tPortfolio("confirmPendingDeposit")}
          </button>
        </div>
      ) : null}

      {phase === "converting" ? (
        <StatusBlock
          title={tDeposit("statusConvertingTitle")}
          description={
            isWrapOnly
              ? tDeposit("statusConvertingWrap")
              : tDeposit("statusConvertingConvert")
          }
          detail={convertStatusLabel}
          loading
        />
      ) : null}

      {phase === "success" ? (
        <StatusBlock
          title={tDeposit("statusSuccessTitle")}
          description={tDeposit("statusSuccessDescription")}
        />
      ) : null}

      {phase === "error" ? (
        <StatusBlock
          title={tDeposit("statusErrorTitle")}
          description={error ?? tDeposit("unexpectedError")}
          isError
        />
      ) : null}
    </div>
  );
}

function StatusBlock({
  title,
  description,
  detail,
  loading = false,
  isError = false
}: {
  title: string;
  description: string;
  detail?: string;
  loading?: boolean;
  isError?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {loading ? (
        <Loader2
          className="h-8 w-8 animate-spin text-[#909090]"
          aria-hidden="true"
        />
      ) : null}
      <p
        className={`m-0 text-xl font-[500] ${isError ? "text-prophet-red" : "text-black"}`}
      >
        {title}
      </p>
      <p className="m-0 max-w-sm text-sm text-[#909090]">{description}</p>
      {detail ? <p className="m-0 text-xs text-[#909090]">{detail}</p> : null}
    </div>
  );
}

export function formatStableflowStatusLabel(
  status: OneClickStatus,
  translate: (key: "bridgeStatus", values: { status: string }) => string,
): string {
  return translate("bridgeStatus", { status });
}
