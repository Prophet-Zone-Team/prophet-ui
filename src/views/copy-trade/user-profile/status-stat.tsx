"use client";

import { useTranslations } from "next-intl";

import {
  resolveCopyTradeAggregateStatus,
  type CopyTradeAggregateStatus,
} from "@/lib/copy-trade/aggregate-copy-status";
import { useCopyTradeTargets } from "@/views/copy-trade/use-copy-trade-targets";

function statusDotClass(status: CopyTradeAggregateStatus): string {
  if (status === "running") {
    return "bg-[#65AF14]";
  }

  return "bg-[#EBEBEB]";
}

function statusLabelClass(status: CopyTradeAggregateStatus): string {
  if (status === "running") {
    return "text-black";
  }

  return "text-[#909090]";
}

export function StatusStat() {
  const tStatus = useTranslations("copyTrade.walletStatus");
  const tCommon = useTranslations("copyTrade.common");
  const { targets, isLoading, isError } = useCopyTradeTargets();
  const status = resolveCopyTradeAggregateStatus(targets);
  const label = tStatus(status);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[14px] leading-[18px] text-[#909090]">
        {tCommon("status")}
      </span>
      {isLoading ? (
        <div
          className="h-5 w-24 animate-pulse rounded bg-[#EBEBEB]"
          aria-label={tCommon("loadingAria")}
        />
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 shrink-0 rounded-full ${statusDotClass(isError ? "na" : status)}`}
            aria-hidden="true"
          />
          <span
            className={`text-[16px] leading-5 ${statusLabelClass(isError ? "na" : status)}`}
          >
            {isError ? tStatus("na") : label}
          </span>
        </div>
      )}
    </div>
  );
}
