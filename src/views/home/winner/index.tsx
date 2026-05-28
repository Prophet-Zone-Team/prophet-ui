"use client";

import {
  useWinnerMarketDataMeta,
  useWinnerSnapshots
} from "@/store/winner-teams-store";
import { HomeWinnerMarketList } from "@/views/home/winner/home-winner-market-list";
import { WinnerProbabilityChart } from "@/views/home/winner/probability-chart";

export function HomeWinnerPanel() {
  const teams = useWinnerSnapshots();
  const dataStatus = useWinnerMarketDataMeta();

  return (
    <>
      <WinnerProbabilityChart
        className="mb-4"
        teams={teams}
        probabilityHistory={[]}
      />
      <HomeWinnerMarketList teams={teams} dataStatus={dataStatus} />
    </>
  );
}
