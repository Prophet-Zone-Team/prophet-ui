"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { WithdrawOperationPhase } from "@/types/funding";
import {
  getWithdrawOperationDescriptionKey,
  getWithdrawOperationTitleKey,
} from "@/views/portfolio/withdraw/types";

export interface WithdrawStatusStepProps {
  phase: WithdrawOperationPhase;
  detail?: string;
  error?: string;
}

export function WithdrawStatusStep({ phase, detail, error }: WithdrawStatusStepProps) {
  const t = useTranslations("portfolio.withdraw");
  const title = t(getWithdrawOperationTitleKey(phase));
  const isError = phase === "error";
  const isSuccess = phase === "success";
  const loading = !isError && !isSuccess && phase !== "idle";

  const description = isError
    ? error ?? t("unexpectedError")
    : isSuccess
      ? t("successBody")
      : detail ?? t(getWithdrawOperationDescriptionKey(phase));

  return (
    <div className="flex flex-col items-center gap-4 pb-10 md:pb-2 pt-16 text-center">
      {loading ? (
        <Loader2
          className="h-8 w-8 animate-spin text-prophet-muted"
          aria-hidden="true"
        />
      ) : null}
      <p
        className={`m-0 text-xl font-[500] ${isError ? "text-prophet-red" : "text-prophet-foreground"}`}
      >
        {title}
      </p>
      <p className="m-0 max-w-sm text-sm text-prophet-muted">{description}</p>
    </div>
  );
}
