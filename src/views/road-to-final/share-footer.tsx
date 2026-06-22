"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Popover } from "@/components/popover";
import { useAuth } from "@/context/auth/use-auth";
import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";

import { EntryStructurePanel } from "./entry-structure-panel";

export function ShareFooter({
  hasChampion,
  predictionCount,
  availableChances,
  tradePromptAmount,
  statsLoading,
  onShare,
  onOpenRecords,
  onOpenRules,
}: {
  hasChampion: boolean;
  predictionCount: number;
  availableChances: number;
  tradePromptAmount: number | null;
  statsLoading?: boolean;
  onShare: () => void;
  onOpenRecords: () => void;
  onOpenRules: () => void;
}) {
  const t = useTranslations("roadToFinal");
  const { isAuthenticated, loginInProgress, openLoginModalOnly } = useAuth();
  const isMobile = useDevice();

  const handleShare = () => {
    if (!hasChampion) {
      return;
    }

    if (isAuthenticated) {
      onShare();
      return;
    }

    void openLoginModalOnly();
  };

  const isAvailableChances = availableChances > 0;
  const shareDisabled = !hasChampion || loginInProgress;
  const timesLabel = statsLoading && isAuthenticated
    ? t("timesLabel", { count: "-" })
    : t("timesLabel", { count: predictionCount });
  const tradePrompt = tradePromptAmount
    ? t("tradeToGetMore", { amount: tradePromptAmount })
    : null;

  const howToGetButton = (
    <button
      type="button"
      className="ml-[10px] text-xs font-medium text-white opacity-50 duration-150 hover:opacity-100"
      onClick={onOpenRules}
    >
      {t("howToGet")}
    </button>
  );

  return (
    <div className="px-[16px] pb-[24px] pt-3 md:px-[24px]">
      <div
        className={cn(
          "mx-auto w-full max-w-[1412px] rounded-[12px] border border-[#33375A]",
          "bg-[rgba(50,57,66,0.5)] px-[16px] py-[12px] md:min-h-[61px] md:px-[20px] md:py-[12px]"
        )}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-wrap items-center gap-x-[10px] gap-y-[8px]">
            <div className="flex items-center gap-1 whitespace-nowrap text-[16px] text-white">
              <div>{t("predictionCountLabel")}:</div>
              <div className={cn(isAvailableChances ? "text-white" : "text-[#FF674B]")}>
                {availableChances}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[8px]">
              {isAvailableChances ? (
                tradePrompt ? (
                  <span
                    className={cn(
                      "inline-flex h-[26px] max-w-full items-center rounded-[14px]",
                      "bg-[#7BCA25]/10 px-[12px] text-[12px] font-[500] text-[#87FF03]/80"
                    )}
                  >
                    {tradePrompt}
                  </span>
                ) : null
              ) : (
                <span className="text-xs font-medium text-[#FF5A3C]">
                  {t("noEntriesNow")}
                </span>
              )}

              {isMobile ? (
                howToGetButton
              ) : (
                <Popover
                  placement="TopLeft"
                  trigger="Hover"
                  content={<EntryStructurePanel variant="tooltip" />}
                >
                  {howToGetButton}
                </Popover>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:gap-6">
            <button
              type="button"
              disabled={shareDisabled}
              className={cn(
                "inline-flex h-[38px] w-full items-center justify-center gap-[8px]",
                "rounded-[6px] bg-[linear-gradient(90deg,#F4B600_0%,#8E6A00_100%)]",
                "px-[16px] text-[14px] text-white transition sm:w-auto md:min-w-[229px]",
                shareDisabled
                  ? "cursor-not-allowed opacity-40"
                  : "hover:opacity-80"
              )}
              onClick={() => handleShare()}
            >
              {t("shareAndJoinCampaign")}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex w-full items-center justify-between gap-[13px] sm:w-auto sm:justify-end">
              <span className="whitespace-nowrap text-[16px] text-white">
                {timesLabel}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
