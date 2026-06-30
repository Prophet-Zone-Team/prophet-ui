"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { ZettaMetricRow } from "./zetta-metric-row";
import { hasZettaWalletPanelData, type ZettaOutcomeWalletCounts } from "./types";

export type ZettaWalletPanelProps = {
  counts?: ZettaOutcomeWalletCounts;
  isLoading?: boolean;
  className?: string;
};

const panelShellClassName =
  "mx-4 flex w-full max-w-[313px] flex-col justify-center gap-[5px] rounded-lg bg-[#F5F5F5] dark:bg-prophet-action-panel px-3 py-2";

export function ZettaWalletPanel({
  counts,
  isLoading = false,
  className
}: ZettaWalletPanelProps) {
  const t = useTranslations("trade");
  const hasSmartWallet = counts?.smartWallet !== undefined;
  const hasBigWhale = counts?.bigWhale !== undefined;
  const hasAnyData = hasZettaWalletPanelData(counts);

  if (!hasAnyData) {
    if (isLoading) {
      return (
        <div
          className={cn(panelShellClassName, "h-[61px]", className)}
          aria-hidden
        >
          <div className="h-[15px] animate-pulse rounded bg-[#E8E8E8] dark:bg-prophet-hover" />
          <div className="h-[15px] animate-pulse rounded bg-[#E8E8E8] dark:bg-prophet-hover" />
        </div>
      );
    }

    return null;
  }

  return (
    <section
      className={cn(
        panelShellClassName,
        hasSmartWallet && hasBigWhale ? "h-[61px]" : "min-h-[33px]",
        className
      )}
      aria-label={t("zettaWalletInsightAria")}
    >
      {hasSmartWallet ? (
        <ZettaMetricRow
          icon="🧙"
          label={t("smartWallet")}
          yesCount={counts.smartWallet!.yesCount}
          noCount={counts.smartWallet!.noCount}
        />
      ) : null}
      {hasBigWhale ? (
        <ZettaMetricRow
          icon="🐋"
          label={t("bigWhale")}
          yesCount={counts.bigWhale!.yesCount}
          noCount={counts.bigWhale!.noCount}
        />
      ) : null}
    </section>
  );
}
