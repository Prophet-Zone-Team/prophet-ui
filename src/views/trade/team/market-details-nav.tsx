"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { trackDetailsClicked } from "@/lib/analytics/tracking";
import { teamDetailHref } from "@/lib/routes/team";
import type { TeamMarketSnapshot } from "@/types/market";

const segmentLabelClassName =
  "font-[Sora] text-[14px] font-[500] leading-[18px] text-black";

export interface MarketDetailsNavProps {
  snapshot: TeamMarketSnapshot;
}

export function MarketDetailsNav({ snapshot }: MarketDetailsNavProps) {
  const t = useTranslations("trade");
  const router = useRouter();
  const { team } = snapshot;

  function handleDetailsClick() {
    trackDetailsClicked({
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      entrySource: "trade_team_page",
      target: "team_detail"
    });
    router.push(teamDetailHref(team.id));
  }

  return (
    <div className="md:hidden w-full">
      <div
        role="tablist"
        aria-label={t("marketDetailsNavAria")}
        className="flex h-[46px] items-center rounded-[12px] bg-[#F4F4F4] p-[5px]"
      >
        <button
          type="button"
          role="tab"
          aria-selected
          className={cn(
            "flex h-[36px] flex-1 items-center justify-center rounded-[8px] border border-[#EBEBEB] bg-white",
            segmentLabelClassName
          )}
        >
          {t("market")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          className={cn(
            "flex h-[36px] flex-1 items-center justify-center rounded-[8px] border border-transparent bg-transparent",
            segmentLabelClassName
          )}
          onClick={handleDetailsClick}
        >
          {t("details")}
        </button>
      </div>
    </div>
  );
}
