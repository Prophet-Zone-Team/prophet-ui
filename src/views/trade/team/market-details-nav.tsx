"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { trackDetailsClicked } from "@/lib/analytics/tracking";
import { teamTradeHref } from "@/lib/routes/trade";
import { teamDetailHref } from "@/lib/routes/team";
import type { TeamMarketSnapshot } from "@/types/market";

const segmentLabelClassName =
  "font-[Sora] text-[14px] font-[500] leading-[18px] text-prophet-foreground";

export interface MarketDetailsNavProps {
  snapshot: TeamMarketSnapshot;
  activeTab?: "market" | "details";
}

export function MarketDetailsNav({
  snapshot,
  activeTab = "market"
}: MarketDetailsNavProps) {
  const t = useTranslations("trade");
  const router = useRouter();
  const { team } = snapshot;
  const isMarketActive = activeTab === "market";

  function handleMarketClick() {
    trackDetailsClicked({
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      entrySource: isMarketActive ? "trade_team_page" : "team_detail_page",
      target: "trade_team"
    });
    router.push(
      teamTradeHref(snapshot.market.polymarket?.slug || snapshot.team.id)
    );
  }

  function handleDetailsClick() {
    trackDetailsClicked({
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      entrySource: "trade_team_page",
      target: "team_detail"
    });
    router.push(teamDetailHref(team.id, { entry: "trade" }));
  }

  return (
    <div className="md:hidden w-full">
      <div
        role="tablist"
        aria-label={t("marketDetailsNavAria")}
        className="flex h-[46px] items-center rounded-[12px] bg-prophet-panel border border-prophet-line p-[5px]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isMarketActive}
          className={cn(
            "flex h-[36px] flex-1 items-center justify-center rounded-[8px] border",
            isMarketActive
              ? "border-prophet-line bg-prophet-panel"
              : "border-transparent bg-transparent",
            segmentLabelClassName
          )}
          onClick={isMarketActive ? undefined : handleMarketClick}
        >
          {t("market")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isMarketActive}
          className={cn(
            "flex h-[36px] flex-1 items-center justify-center rounded-[8px] border",
            isMarketActive
              ? "border-transparent bg-transparent"
              : "border-prophet-line bg-prophet-panel",
            segmentLabelClassName
          )}
          onClick={isMarketActive ? handleDetailsClick : undefined}
        >
          {t("details")}
        </button>
      </div>
    </div>
  );
}
