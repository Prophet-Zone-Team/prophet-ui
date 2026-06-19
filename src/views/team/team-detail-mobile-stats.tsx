"use client";

import { useTranslations } from "next-intl";

import type { TeamDetailHeaderData } from "@/lib/team/map-team-detail";
import { formatNumber } from "@/utils";

export interface TeamDetailMobileStatsProps {
  detail?: TeamDetailHeaderData;
}

function MobileStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-[3px] text-center">
      <span className="font-[Sora] text-[16px] font-[500] leading-[20px] capitalize text-black">
        {value}
      </span>
      <span className="font-[Sora] text-[12px] font-[400] leading-[15px] text-[#909090]">
        {label}
      </span>
    </div>
  );
}

export function TeamDetailMobileStats({ detail }: TeamDetailMobileStatsProps) {
  const t = useTranslations("teamDetail");

  function getGroupLabel(groupName?: string): string {
    if (!groupName) {
      return t("pending");
    }

    return groupName.startsWith("Group")
      ? groupName
      : t("groupLabel", { group: groupName });
  }

  const squadValue = detail?.marketValue
    ? formatNumber(detail.marketValue, 2, true, {
        prefix: "€",
        isShort: true,
        isShortUppercase: true
      })
    : "-";

  return (
    <div className="flex items-start justify-between pt-2 gap-2 md:hidden">
      <MobileStat label={t("group")} value={getGroupLabel(detail?.groupName)} />
      <MobileStat label={t("squadValue")} value={squadValue} />
      <MobileStat
        label={t("bestFinish")}
        value={detail?.bestFinish ?? t("pending")}
      />
    </div>
  );
}
