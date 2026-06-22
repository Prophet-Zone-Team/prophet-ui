"use client";

import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import type { WinnerActivityRecord } from "@/types/prophet-api";

import {
  formatPredictionRecordPath,
  resolveChampionDisplayName
} from "./lib/winner-prediction";

export function PredictionRecordsModal({
  open,
  onClose,
  records,
  isLoading,
  isError
}: {
  open: boolean;
  onClose: () => void;
  records: WinnerActivityRecord[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  const t = useTranslations("roadToFinal");

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("predictionRecordsTitle")}
      className="w-full max-w-[640px]"
      overlayClassName="z-[70]"
    >
      <div
        className={cn(
          "rounded-[20px] border border-[#EBEBEB] bg-white",
          "p-[16px] shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        )}
      >
        <h2 className="m-0 pr-[32px] text-[20px] font-[500] text-black">
          {t("predictionRecordsTitle")}
        </h2>

        <div className="mt-[16px] max-h-[400px] space-y-[10px] overflow-y-auto">
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

                return (
                  <article
                    key={record.id}
                    className={cn(
                      "rounded-[12px] border border-[#EBEBEB] bg-white px-[16px] py-[14px]"
                    )}
                  >
                    <p className="m-0 text-[14px] font-[500] text-black">
                      {t("roadToFinalRecordTitle", { teamName: championName })}
                    </p>
                    <p className="m-0 mt-[6px] truncate text-[12px] text-[#909090]">
                      {path}
                    </p>
                  </article>
                );
              })
            : null}
        </div>
      </div>
    </Modal>
  );
}
