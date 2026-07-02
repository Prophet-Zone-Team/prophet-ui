"use client";

import { useTranslations } from "next-intl";

import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface DossierRecentFormProps {
  formResults: string[];
  latestLabel?: string;
}

export function DossierRecentForm({
  formResults,
  latestLabel
}: DossierRecentFormProps) {
  const t = useTranslations("teamDetail");

  return (
    <section className={teamPanelClass} aria-label={t("recentFormAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("recentForm")}</h2>
      </div>
      <div className="p-4">
        {formResults.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {formResults.map((result, index) => (
                <span
                  key={`${result}-${index}`}
                  className={
                    result === "W"
                      ? "inline-flex size-8 items-center justify-center rounded-md bg-[#f1fdf8] text-sm font-[500] text-prophet-green"
                      : result === "L"
                        ? "inline-flex size-8 items-center justify-center rounded-md bg-[#fff4f6] text-sm font-[500] text-prophet-red"
                        : "inline-flex size-8 items-center justify-center rounded-md bg-prophet-base text-sm font-[500] text-prophet-muted"
                  }
                >
                  {result}
                </span>
              ))}
            </div>
            <p className="m-0 mt-3 text-xs text-prophet-muted">
              {latestLabel ?? t("recentResultsLoaded")}
            </p>
          </>
        ) : (
          <TeamEmptyState
            title={t("recentFormNoData")}
            body={t("recentFormNoDataBody")}
          />
        )}
      </div>
    </section>
  );
}
