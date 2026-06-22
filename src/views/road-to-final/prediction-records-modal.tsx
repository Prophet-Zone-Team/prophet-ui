"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import type { WinnerActivityRecord } from "@/types/prophet-api";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";

import {
  formatJoinedHistoryTimestamp,
  formatPredictionRecordPath,
  resolveChampionDisplayName,
} from "./lib/winner-prediction";

export function PredictionRecordsModal({
  open,
  onClose,
  records,
  isLoading,
  isError,
}: {
  open: boolean;
  onClose: () => void;
  records: WinnerActivityRecord[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  const t = useTranslations("roadToFinal");
  const locale = useLocale();
  const isMobile = useDevice();

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("joinedHistoryTitle")}
      className="w-full max-w-[640px]"
      overlayClassName="z-[70]"
    >
      <div
        className={cn(
          "relative rounded-[20px] border border-[#EBEBEB] bg-white",
          "p-[16px] shadow-[0_0_10px_rgba(0,0,0,0.1)]",
          "max-md:border-0 max-md:rounded-none max-md:px-3 max-md:pb-8 max-md:pt-[45px] max-md:shadow-none"
        )}
      >
        {isMobile ? (
          <button
            type="button"
            className="absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#18110F] transition-colors hover:bg-[#fafbfc]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <h2 className="m-0 pr-[32px] text-[20px] font-medium text-black">
          {t("joinedHistoryTitle")}
        </h2>

        <div className="mt-[16px] max-h-[400px] space-y-[10px] overflow-y-auto max-md:max-h-none max-md:overflow-visible">
          {isLoading ? (
            <p className="m-0 text-[14px] text-[#909090]">
              {t("loadingPredictionRecords")}
            </p>
          ) : null}

          {!isLoading && isError ? (
            <p className="m-0 text-[14px] text-[#991B1B]">
              {t("unableToLoadPredictionRecords")}
            </p>
          ) : null}

          {!isLoading && !isError && records.length === 0 ? (
            <p className="m-0 text-[14px] text-[#909090]">
              {t("noPredictionRecords")}
            </p>
          ) : null}

          {!isLoading && !isError
            ? records.map((record) => {
                const championName = resolveChampionDisplayName(
                  record.champion_team || record.prediction.champion_team
                );
                const path = formatPredictionRecordPath(record.prediction);
                const twitterUrl = record.twitter_url?.trim();
                const timestamp = formatJoinedHistoryTimestamp(
                  record.create_time,
                  locale
                );

                return (
                  <article
                    key={record.id}
                    className="overflow-hidden rounded-[8px] border border-[#EBEBEB] bg-white"
                  >
                    <div className="px-[16px] py-[12px]">
                      <div className="flex items-start justify-between gap-[12px]">
                        <p className="m-0 text-[14px] font-medium text-black">
                          {t("roadToFinalRecordTitle", {
                            teamName: championName,
                          })}
                        </p>
                        <p className="m-0 shrink-0 text-[12px] text-[#909090]">
                          {timestamp}
                        </p>
                      </div>
                      <p className="m-0 mt-[6px] truncate text-[12px] text-black">
                        {path}
                      </p>
                    </div>

                    <div className="border-t border-[#EBEBEB] bg-[#F5F5F5] px-[16px] py-[10px]">
                      <p className="m-0 truncate text-[12px] text-[#909090]">
                        {t("sharingLinkLabel")}{" "}
                        {twitterUrl ? (
                          <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3058D2] underline"
                          >
                            {twitterUrl}
                          </a>
                        ) : (
                          <span className="text-[#909090]">—</span>
                        )}
                      </p>
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
