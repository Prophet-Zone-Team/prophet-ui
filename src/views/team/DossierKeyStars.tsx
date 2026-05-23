import type { KeyPlayerView } from "../../lib/team/teamDetailModel";
import { getInitials } from "../../lib/team/teamDetailModel";
import type { TeamFootballMetadata } from "../../types/market";
import {
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "./teamDetailUi";

export interface DossierKeyStarsProps {
  players: KeyPlayerView[];
  metadata?: TeamFootballMetadata;
}

export function DossierKeyStars({ players, metadata }: DossierKeyStarsProps) {
  return (
    <section className={teamPanelClass} aria-label="Key stars">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Key Stars</h2>
        <span className={teamPanelBadgeClass}>
          {metadata?.source ? "Curated" : "Pending"}
        </span>
      </div>
      <div className="grid gap-2 p-4">
        {players.slice(0, 3).map((player) => (
          <div key={player.name} className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f5f9ff] text-[10px] font-[556] text-[#125afc]">
              {getInitials(player.name)}
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-xs font-[556] text-black">
                {player.name}
              </strong>
              <span className="block truncate text-[10px] text-prophet-muted">
                {player.position}
                {player.club ? ` / ${player.club}` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
