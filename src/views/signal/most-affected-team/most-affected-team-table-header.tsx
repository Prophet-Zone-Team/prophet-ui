"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export const mostAffectedTeamTableGridClass =
  "hidden md:grid w-full grid-cols-[10%_30%_22%_34%] items-center gap-x-2";

export function MostAffectedTeamTableHeader() {
  const t = useTranslations("signal");

  return (
    <div
      role="row"
      className={cn(
        mostAffectedTeamTableGridClass,
        "text-[16px] font-[400] leading-[19px] text-prophet-muted"
      )}
    >
      <span role="columnheader">{t("rank")}</span>
      <span role="columnheader">{t("team")}</span>
      <span role="columnheader">{t("netImpact")}</span>
      <span role="columnheader" className="text-right">
        {t("highImpactEvents")}
      </span>
    </div>
  );
}
