"use client";

import { ChevronRight, Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth/use-auth";
import { cn } from "@/lib/cn";

export function ShareFooter({
  hasChampion,
  predictionCount,
  availableChances,
  tradePromptAmount,
  statsLoading,
  onShare,
  onOpenRecords
}: {
  hasChampion: boolean;
  predictionCount: number;
  availableChances: number;
  tradePromptAmount: number | null;
  statsLoading?: boolean;
  onShare: (type: "save" | "share") => void;
  onOpenRecords: () => void;
}) {
  const t = useTranslations("roadToFinal");
  const { isAuthenticated, loginInProgress, openLoginModalOnly } = useAuth();

  const handleShare = (type: "save" | "share") => {
    if (!hasChampion) {
      return;
    }

    if (isAuthenticated) {
      onShare(type);
      return;
    }

    void openLoginModalOnly();
  };

  const shareDisabled = !hasChampion || loginInProgress;
  const predictionLabel = statsLoading && isAuthenticated
    ? t("predictionCountLabel", { count: "--" })
    : t("predictionCountLabel", { count: predictionCount });
  const timesLabel = statsLoading && isAuthenticated
    ? t("timesLabel", { count: "--" })
    : t("timesLabel", { count: availableChances });
  const tradePrompt = tradePromptAmount
    ? t("tradeToGetMore", { amount: tradePromptAmount })
    : null;

  return (
    <div className="px-[16px] pb-[24px] md:px-[24px] pt-3">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1412px] flex-wrap items-center gap-[12px]",
          "rounded-[12px] border border-[#33375A] bg-[rgba(50,57,66,0.5)]",
          "px-[16px] py-[12px] md:min-h-[61px] md:flex-nowrap md:px-[20px] md:py-0"
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-[12px] md:flex-nowrap">
          <span className="whitespace-nowrap text-[16px] text-white">
            {predictionLabel}
          </span>

          <button
            type="button"
            className={cn(
              "inline-flex h-[30px] min-w-[80px] items-center justify-center rounded-[6px]",
              "border border-[#33375A] bg-[rgba(50,57,66,0.5)] px-[12px]",
              "text-[12px] font-[500] text-white transition hover:border-white/30"
            )}
            onClick={onOpenRecords}
          >
            {t("checkRecords")}
          </button>

          <div className="hidden h-[23px] w-px bg-[#33375A] md:block" aria-hidden />

          <span className="whitespace-nowrap text-[16px] text-white">
            {timesLabel}
          </span>

          {tradePrompt ? (
            <span
              className={cn(
                "inline-flex h-[26px] items-center rounded-[14px]",
                "bg-[#7BCA25]/10 px-[12px] text-[12px] font-[500] text-[#87FF03]/80"
              )}
            >
              {tradePrompt}
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex w-full flex-wrap items-center gap-[12px] md:w-auto md:flex-nowrap">
          <button
            type="button"
            disabled={shareDisabled}
            className={cn(
              "inline-flex h-[38px] flex-1 items-center justify-center gap-[8px]",
              "rounded-[6px] border border-[#33375A] bg-[rgba(50,57,66,0.5)]",
              "px-[16px] text-[14px] text-white transition md:flex-none md:min-w-[180px]",
              shareDisabled
                ? "cursor-not-allowed opacity-40"
                : "hover:border-white/30"
            )}
            onClick={() => handleShare("save")}
          >
            {t("confirmAndSave")}
            <Download className="h-[13px] w-[13px]" aria-hidden />
          </button>

          <button
            type="button"
            disabled={shareDisabled}
            className={cn(
              "inline-flex h-[38px] flex-1 items-center justify-center gap-[8px]",
              "rounded-[6px] bg-[linear-gradient(90deg,#F4B600_0%,#8E6A00_100%)]",
              "px-[16px] text-[14px] text-white transition md:flex-none md:min-w-[229px]",
              shareDisabled
                ? "cursor-not-allowed opacity-40"
                : "hover:opacity-80"
            )}
            onClick={() => handleShare("share")}
          >
            {t("shareAndJoinCampaign")}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
