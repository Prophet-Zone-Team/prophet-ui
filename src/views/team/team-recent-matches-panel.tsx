import type { RecentMatchView } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamRecentMatchesPanelProps {
  matches: RecentMatchView[];
}

export function TeamRecentMatchesPanel({ matches }: TeamRecentMatchesPanelProps) {
  return (
    <section className={teamPanelClass} aria-label="Recent matches">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Recent Matches</h2>
      </div>
      <div className="p-4">
        {matches.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[460px]">
              <div className="grid grid-cols-[80px_1fr_48px_72px_1fr] gap-2 border-b border-prophet-line pb-2 text-[10px] font-[556] uppercase tracking-wide text-prophet-muted">
                <span>Date</span>
                <span>Opponent</span>
                <span>Result</span>
                <span>Score</span>
                <span>Competition</span>
              </div>
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="grid grid-cols-[80px_1fr_48px_72px_1fr] gap-2 border-b border-prophet-line/60 py-2.5 text-sm last:border-b-0"
                >
                  <span className="text-prophet-muted">{match.date}</span>
                  <strong className="font-[556] text-black">{match.opponent}</strong>
                  <b
                    className={
                      match.result === "W"
                        ? "font-[556] text-prophet-green"
                        : match.result === "L"
                          ? "font-[556] text-prophet-red"
                          : "font-[556] text-prophet-muted"
                    }
                  >
                    {match.result}
                  </b>
                  <span>{match.score}</span>
                  <p className="m-0 truncate text-xs text-prophet-muted">
                    {match.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <TeamEmptyState
            title="No recent result data"
            body="Finished fixtures are not available for this team yet. Market movement is not used as a substitute for match form."
          />
        )}
      </div>
    </section>
  );
}
