import type { TeamMarketSnapshot, WorldCupMatch } from "../../../types/market";
import { HomeMatchesSchedulePanel } from "./HomeMatchesSchedulePanel";

export interface HomeMatchesPanelProps {
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
}

export function HomeMatchesPanel({
  matches,
  snapshots
}: HomeMatchesPanelProps) {
  return (
    <div className="min-w-0 pb-4">
      <HomeMatchesSchedulePanel matches={matches} snapshots={snapshots} />
    </div>
  );
}
