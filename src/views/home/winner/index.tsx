import type { MarketDataMeta } from "../../../data/providers/types";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "../../../types/market";
import { HomeWinnerMarketList } from "./HomeWinnerMarketList";
import { WinnerProbabilityChart } from "./probability-chart";

export interface HomeWinnerPanelProps {
  teams: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
  probabilityHistory: ProbabilityHistoryPoint[];
}

export function HomeWinnerPanel({
  teams,
  dataStatus,
  probabilityHistory
}: HomeWinnerPanelProps) {
  return (
    <>
      <WinnerProbabilityChart
        className="mb-4"
        teams={teams}
        probabilityHistory={probabilityHistory}
      />
      <HomeWinnerMarketList teams={teams} dataStatus={dataStatus} />
    </>
  );
}
