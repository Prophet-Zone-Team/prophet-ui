"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { MatchHistoryDesktopRow, MatchHistoryMobileCard } from "./row";
import { matchHistoryTableGridClass } from "./table-grid";
import type { MatchHistoryEntry } from "./types";

export type MatchHistoryProps = {
  matches?: MatchHistoryEntry[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

export function MatchHistory({
  matches = [],
  isLoading = false,
  isError = false,
  className
}: MatchHistoryProps) {
  const t = useTranslations("trade");

  return (
    <section
      aria-label={t("matchHistoryAria")}
      className={cn(
        "w-full max-w-none md:max-w-[531px] rounded-[12px] bg-white px-[12px] py-[16px]",
        "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[500] leading-[21px] text-black">
        {t("matchHistory")}
      </h2>

      <div className="mt-[12px] flex w-full flex-col">
        {isLoading ? (
          <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
            {t("loadingData")}
          </p>
        ) : isError ? (
          <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
            {t("unableToLoadData")}
          </p>
        ) : matches.length === 0 ? (
          <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
            {t("matchHistoryEmpty")}
          </p>
        ) : (
          <>
            <div
              role="table"
              aria-label={t("matchHistoryTableAria")}
              className="hidden w-full flex-col md:flex"
            >
              <div
                role="row"
                className={cn(
                  matchHistoryTableGridClass,
                  "px-[12px] pb-[8px] text-[12px] font-[400] leading-[17px] text-[#909090]"
                )}
              >
                <span role="columnheader">{t("time")}</span>
                <span role="columnheader">{t("format")}</span>
                <span role="columnheader">{t("home")}</span>
                <span role="columnheader" className="text-center">
                  {t("versus")}
                </span>
                <span role="columnheader">{t("away")}</span>
                <span role="columnheader">{t("result")}</span>
              </div>

              <div className="flex flex-col gap-[2px]">
                {matches.map((entry, index) => (
                  <MatchHistoryDesktopRow
                    key={entry.id}
                    entry={entry}
                    highlighted={index % 2 === 0}
                    tall={Boolean(entry.penaltyScore)}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex flex-col gap-2 md:hidden"
              aria-label={t("matchHistoryTableAria")}
            >
              {matches.map((entry, index) => (
                <MatchHistoryMobileCard
                  key={entry.id}
                  entry={entry}
                  highlighted={index % 2 === 0}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export type {
  MatchHistoryEntry,
  MatchHistoryResultKind,
  MatchHistoryTeamOption
} from "./types";
