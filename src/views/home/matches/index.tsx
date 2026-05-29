import type { FootballMatchesResult } from "@/data/providers/football-matches";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { HomeMatchesSchedulePanel } from "@/views/home/matches/home-matches-schedule-panel";

export interface HomeMatchesPanelProps {
  matches: WorldCupMatch[];
  matchesMeta: FootballMatchesResult["meta"];
  /** Optional team winner snapshots; schedule rows use match display names when empty. */
  snapshots?: TeamMarketSnapshot[];
}

export function HomeMatchesPanel({
  matches,
  matchesMeta,
  snapshots = []
}: HomeMatchesPanelProps) {
  if (matches.length === 0) {
    return (
      <div className="min-w-0 pb-4">
        <section
          className="min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-4 py-8 text-center"
          aria-label="Football match schedule"
        >
          <p className="m-0 text-sm text-[#909090]">
            {matchesMeta.status === "unavailable"
              ? matchesMeta.source
              : "No World Cup match markets are available on Polymarket right now."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-4">
      <HomeMatchesSchedulePanel matches={matches} snapshots={snapshots} />
    </div>
  );
}
