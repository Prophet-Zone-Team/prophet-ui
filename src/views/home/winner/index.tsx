"use client";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";
import {
  useWinnerMarketDataMeta,
  useWinnerSnapshots
} from "@/store/winner-teams-store";
import { HomeWinnerMarketList } from "@/views/home/winner/home-winner-market-list";
import { WinnerProbabilityChart } from "@/views/home/winner/probability-chart";

export function HomeWinnerPanel() {
  const teams = useWinnerSnapshots();
  const dataStatus = useWinnerMarketDataMeta();
  const chartSectionRef = useAnalyticsImpression<HTMLDivElement>({
    eventName: "section_viewed",
    dedupeKey: "section:winner_chart",
    payload: { section: "winner_chart", sectionIndex: 1 }
  });
  const teamListSectionRef = useAnalyticsImpression<HTMLDivElement>({
    eventName: "section_viewed",
    dedupeKey: "section:team_list",
    payload: { section: "team_list", sectionIndex: 2 }
  });

  return (
    <div className="px-3 md:px-0">
      <div ref={chartSectionRef}>
        <WinnerProbabilityChart className="mb-4" teams={teams} />
      </div>
      <div ref={teamListSectionRef}>
        <HomeWinnerMarketList teams={teams} dataStatus={dataStatus} />
      </div>
    </div>
  );
}
