"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { ZettaMetricRow } from "./zetta-metric-row";
import type { ZettaOutcomeWalletCounts } from "./types";

export type ZettaWalletPanelProps = {
  counts?: ZettaOutcomeWalletCounts;
  isLoading?: boolean;
  className?: string;
};

export function ZettaWalletPanel({
  counts,
  isLoading = false,
  className
}: ZettaWalletPanelProps) {
  const t = useTranslations("trade");

  if (!counts) {
    if (isLoading) {
      return (
        <div
          className={cn(
            "mx-4 flex h-[61px] w-full max-w-[313px] flex-col justify-center gap-[5px] rounded-lg bg-[#F5F5F5] px-3 py-2",
            className
          )}
          aria-hidden
        >
          <div className="h-[15px] animate-pulse rounded bg-[#E8E8E8]" />
          <div className="h-[15px] animate-pulse rounded bg-[#E8E8E8]" />
        </div>
      );
    }

    return null;
  }

  return (
    <section
      className={cn(
        "mx-4 flex h-[61px] w-full max-w-[313px] flex-col justify-center gap-[5px] rounded-lg bg-[#F5F5F5] px-3 py-2",
        className
      )}
      aria-label={t("zettaWalletInsightAria")}
    >
      <ZettaMetricRow
        icon="🧙"
        label={t("smartWallet")}
        yesCount={counts.yesSmartWalletCount}
        noCount={counts.noSmartWalletCount}
      />
      <ZettaMetricRow
        icon="🐋"
        label={t("bigWhale")}
        yesCount={counts.yesWhaleWalletCount}
        noCount={counts.noWhaleWalletCount}
      />
    </section>
  );
}
