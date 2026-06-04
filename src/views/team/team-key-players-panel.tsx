import type { KeyPlayerView } from "@/lib/team/team-detail-model";
import { getInitials } from "@/lib/team/team-detail-model";
import { cn } from "@/lib/cn";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamKeyPlayersPanelProps {
  players: KeyPlayerView[];
}

function PlayerMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-prophet-muted">{label}</span>
      <strong
        className={cn(
          "font-[500]",
          tone === "down" && "text-prophet-red",
          tone === "up" && "text-prophet-green",
          !tone && "text-black"
        )}
      >
        {value}
      </strong>
    </div>
  );
}

export function TeamKeyPlayersPanel({ players }: TeamKeyPlayersPanelProps) {
  return (
    <section className={teamPanelClass} aria-label="Key players">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Key Players</h2>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {players.length > 0 ? (
          players.map((player) => (
            <article
              key={player.name}
              className="rounded-lg border border-prophet-line bg-[#fafbfc] p-3"
            >
              <div className="flex items-center gap-2">
                {player.logo ? (
                  <img
                    src={player.logo}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f5f9ff] text-xs font-[500] text-[#125afc]">
                    {getInitials(player.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="m-0 truncate text-sm font-[500] text-black">
                    {player.name}
                  </h3>
                  <p className="m-0 text-xs text-prophet-muted">
                    {player.position}
                    {player.number ? ` / #${player.number}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-1.5">
                <PlayerMetric
                  label="Expected minutes"
                  value={`${player.expectedMinutes}%`}
                />
                <PlayerMetric
                  label="Squad probability"
                  value={`${player.squadProbability}%`}
                />
                <PlayerMetric
                  label="Form score"
                  value={String(player.formScore)}
                />
                <PlayerMetric
                  label="Injury status"
                  value={player.injuryStatus}
                  tone={player.injuryStatus === "Risk" ? "down" : "up"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-prophet-line pt-2 text-xs">
                <span className="text-prophet-muted">
                  {player.club ? "Club" : "Profile note"}
                </span>
                <strong className="truncate font-[500] text-black">
                  {player.club ?? player.note ?? player.topMarket}
                </strong>
              </div>
            </article>
          ))
        ) : (
          <div className="sm:col-span-2">
            <TeamEmptyState
              title="No key players"
              body="Key player data is not available for this team yet."
            />
          </div>
        )}
      </div>
    </section>
  );
}
