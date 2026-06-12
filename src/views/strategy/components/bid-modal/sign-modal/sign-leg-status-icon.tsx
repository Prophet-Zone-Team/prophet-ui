"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import type { LegSignStatus } from "../types";

export type SignLegStatusIconProps = {
  status: LegSignStatus;
  showError?: boolean;
  className?: string;
};

export function SignLegStatusIcon({
  status,
  showError = false,
  className
}: SignLegStatusIconProps) {
  const t = useTranslations("strategy");

  if (status === "signed") {
    return (
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-[#65AF14]",
          className
        )}
        aria-hidden
      >
        <Check className="size-3 text-white" strokeWidth={2.5} />
      </span>
    );
  }

  if (showError || status === "sign_failed" || status === "submit_failed") {
    return (
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-[#FF674B] font-[Sora] text-xs font-semibold text-white",
          className
        )}
        aria-hidden
      >
        !
      </span>
    );
  }

  if (status === "signing") {
    return (
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-[#EBEBEB] bg-white",
          className
        )}
        aria-label={t("signing")}
      >
        <Loader2 className="size-3 animate-spin text-[#65AF14]" aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-[#EBEBEB] bg-white",
        className
      )}
      aria-hidden
    />
  );
}
