"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { TRADE_ENTRY_TIERS } from "./lib/trade-entry-tiers";

export function EntryStructurePanel({
  variant = "embedded",
  onOpenRules,
}: {
  variant?: "tooltip" | "embedded";
  onOpenRules?: () => void;
}) {
  const t = useTranslations("roadToFinal");

  return (
    <div
      className={cn(
        variant === "tooltip"
          ? "w-[min(376px,calc(100vw-2rem))] rounded-[12px] border border-[#EBEBEB] bg-white p-[16px] shadow-[0_0_10px_rgba(0,0,0,0.1)]"
          : "w-full"
      )}
    >
      <p className="m-0 text-[14px] font-semibold text-black">
        {t("entryStructureTitle")}
      </p>
      <p className="m-0 mt-[12px] text-[14px] leading-[1.2] text-black">
        {t("entryStructureDescription")}
      </p>

      <div className="mt-[16px]">
        <div className="flex items-center justify-between text-[14px] text-[#909090]">
          <span>{t("entryStructureVolumeHeader")}</span>
          <span>{t("entryStructureEntriesHeader")}</span>
        </div>

        <div className="mt-[8px] space-y-[8px]">
          {TRADE_ENTRY_TIERS.map((tier) => (
            <div
              key={tier.thresholdUsdc}
              className="flex items-center justify-between border-b border-dashed border-[#EBEBEB] pb-[8px] text-[14px] text-black last:border-b-0 last:pb-0"
            >
              <span>
                {t("entryStructureTierVolume", { amount: tier.thresholdUsdc })}
              </span>
              <span>
                {t("entryStructureTierEntries", { count: tier.entries })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="m-0 mt-[16px] text-[14px] leading-[1.2] text-black">
        {t("entryStructureMaxNote")}.&nbsp;&nbsp;
        {
          variant === "tooltip" && (
            <button
              type="button"
              className="text-[#77A4EF] underline underline-offset-1"
              onClick={onOpenRules}
            >
              {t("entryStructureMaxNoteReadMore")}
            </button>
          )
        }
      </p>
    </div>
  );
}
