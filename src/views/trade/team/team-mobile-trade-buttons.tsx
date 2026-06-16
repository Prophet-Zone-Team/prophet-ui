"use client";

import { useTranslations } from "next-intl";

import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";

export interface TeamMobileTradeButtonsProps {
  yesPrice: number;
  noPrice: number;
  onSelect: (side: "yes" | "no") => void;
  disabled?: boolean;
}

export function TeamMobileTradeButtons({
  yesPrice,
  noPrice,
  onSelect,
  disabled = false
}: TeamMobileTradeButtonsProps) {
  const t = useTranslations("trade");
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  return (
    <div className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-between gap-5 border-t border-[#EBEBEB] bg-white p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] md:hidden">
      <button
        type="button"
        className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF674B] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={() => onSelect("no")}
      >
        <span className="text-lg font-[500]">{t("no")}</span>
        <span className="text-xs font-[500] leading-[14px]">
          {formatOutcomeDisplay(noPrice)}
        </span>
      </button>
      <button
        type="button"
        className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#65AF14] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={() => onSelect("yes")}
      >
        <span className="text-lg font-[500]">{t("yes")}</span>
        <span className="text-xs font-[500] leading-[14px]">
          {formatOutcomeDisplay(yesPrice)}
        </span>
      </button>
    </div>
  );
}
