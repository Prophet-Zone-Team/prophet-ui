import type { RecentMatchView } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface DossierRecentFormProps {
  matches: RecentMatchView[];
}

export function DossierRecentForm({ matches }: DossierRecentFormProps) {
  return (
    <section className={teamPanelClass} aria-label="Recent form">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Recent Form</h2>
        <span className={teamPanelBadgeClass}>Last 5</span>
      </div>
      <div className="p-4">
        {matches.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {matches.map((match) => (
                <span
                  key={match.id}
                  className={
                    match.result === "W"
                      ? "inline-flex size-8 items-center justify-center rounded-md bg-[#f1fdf8] text-sm font-[556] text-prophet-green"
                      : match.result === "L"
                        ? "inline-flex size-8 items-center justify-center rounded-md bg-[#fff4f6] text-sm font-[556] text-prophet-red"
                        : "inline-flex size-8 items-center justify-center rounded-md bg-[#fafbfc] text-sm font-[556] text-prophet-muted"
                  }
                >
                  {match.result}
                </span>
              ))}
            </div>
            <p className="m-0 mt-3 text-xs text-prophet-muted">
              {matches[0]?.opponent
                ? `Latest: ${matches[0].result} vs ${matches[0].opponent}, ${matches[0].score}`
                : "Recent results loaded."}
            </p>
          </>
        ) : (
          <TeamEmptyState
            title="No recent result data"
            body="API-Football has not attached finished fixtures for this team yet."
          />
        )}
      </div>
    </section>
  );
}
