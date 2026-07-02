"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { MostAffectedTeamTableHeader } from "./most-affected-team-table-header";
import {
  MostAffectedTeamDesktopRow,
  MostAffectedTeamMobileCard
} from "./most-affected-team-table-row";
import type { MostAffectedTeamEntry } from "./types";

export type MostAffectedTeamTableProps = {
  entries: MostAffectedTeamEntry[];
  className?: string;
};

export function MostAffectedTeamTable({
  entries,
  className
}: MostAffectedTeamTableProps) {
  const t = useTranslations("signal");
  const tableLabel = t("mostAffectedTeamsAria");

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-[16px] leading-[19px] text-prophet-muted">
        {t("noTeamImpactData")}
      </p>
    );
  }

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        role="table"
        aria-label={tableLabel}
        className="hidden w-full flex-col md:flex"
      >
        <MostAffectedTeamTableHeader />
        <div className="mt-3 flex flex-col gap-1">
          {entries.map((entry) => (
            <MostAffectedTeamDesktopRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:hidden" aria-label={tableLabel}>
        {entries.map((entry, index) => (
          <MostAffectedTeamMobileCard
            key={entry.id}
            entry={entry}
            className={index % 2 === 0 ? "bg-prophet-base" : "bg-prophet-panel"}
          />
        ))}
      </div>
    </div>
  );
}
