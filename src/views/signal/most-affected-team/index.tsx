"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { MostAffectedTeamTable } from "./most-affected-team-table";
import { mostAffectedTeamData } from "./mock-data";
import type { MostAffectedTeamData } from "./types";

export type MostAffectedTeamProps = {
  data?: MostAffectedTeamData;
  className?: string;
  isLoading?: boolean;
};

export function MostAffectedTeam({
  data = mostAffectedTeamData,
  className,
  isLoading = false
}: MostAffectedTeamProps) {
  const t = useTranslations("signal");

  return (
    <section
      aria-label={t("mostAffectedTeamAria")}
      className={cn(
        "box-border flex h-auto w-full max-w-none flex-col md:h-[564px]",
        "rounded-[12px] border border-prophet-line bg-prophet-panel px-3 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-lg font-[400] leading-[22px] text-prophet-foreground md:text-[20px] md:leading-[24px]">
        {t("mostAffectedTeam")}
      </h2>

      <div className="mt-4 min-h-0 flex-1 md:mt-[26px]">
        {isLoading ? (
          <p className="text-[14px] text-prophet-muted">{t("loading")}</p>
        ) : (
          <MostAffectedTeamTable entries={data.entries} />
        )}
      </div>
    </section>
  );
}

export type { MostAffectedTeamData, MostAffectedTeamEntry } from "./types";
