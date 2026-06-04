import type { TeamDetailGroupPeer } from "@/lib/team/map-team-detail";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface DossierGroupContextProps {
  groupLabel?: string;
  peers: TeamDetailGroupPeer[];
}

export function DossierGroupContext({
  groupLabel,
  peers
}: DossierGroupContextProps) {
  return (
    <section className={teamPanelClass} aria-label="Group context">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Group Context</h2>
      </div>
      <div className="p-4">
        {groupLabel && peers.length > 0 ? (
          <div className="grid gap-1.5">
            <strong className="rounded-md border border-prophet-line bg-[#f5f9ff] px-2 py-1.5 text-xs font-[500] text-[#125afc]">
              {groupLabel.startsWith("Group")
                ? groupLabel
                : `Group ${groupLabel}`}
            </strong>
            {peers.slice(0, 4).map((peer) => (
              <span
                key={peer.code}
                className="flex items-center gap-2 rounded-md border border-prophet-line px-2 py-1.5 text-xs capitalize text-black"
              >
                {peer.logo ? (
                  <img
                    src={peer.logo}
                    alt=""
                    className="size-5 shrink-0 rounded-full object-contain"
                  />
                ) : null}
                <span className="min-w-0 truncate">
                  {peer.name}
                  {peer.fifaRank ? ` / #${peer.fifaRank}` : ""}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <TeamEmptyState
            title="Group pending"
            body="Group context is not available for this team yet."
          />
        )}
      </div>
    </section>
  );
}
