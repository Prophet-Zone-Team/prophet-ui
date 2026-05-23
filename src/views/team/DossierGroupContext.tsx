import type { TeamFootballMetadata } from "../../types/market";
import { getGroupPeerMetadata } from "../../lib/team/teamDetailModel";
import { TeamEmptyState } from "./TeamEmptyState";
import {
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "./teamDetailUi";

export interface DossierGroupContextProps {
  metadata?: TeamFootballMetadata;
  allMetadata: TeamFootballMetadata[];
}

export function DossierGroupContext({
  metadata,
  allMetadata
}: DossierGroupContextProps) {
  const peers = getGroupPeerMetadata(metadata, allMetadata);

  return (
    <section className={teamPanelClass} aria-label="Group context">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Group Context</h2>
        <span className={teamPanelBadgeClass}>
          {metadata?.group && metadata.group !== "Pending"
            ? `Group ${metadata.group}`
            : "Pending"}
        </span>
      </div>
      <div className="p-4">
        {metadata?.group && metadata.group !== "Pending" ? (
          <div className="grid gap-1.5">
            <strong className="rounded-md border border-prophet-line bg-[#f5f9ff] px-2 py-1.5 text-xs font-[556] text-[#125afc]">
              {peers.length > 0 ? `${peers.length} listed peers` : "Peers pending"}
            </strong>
            {peers.slice(0, 3).map((peer) => (
              <span
                key={peer.teamId}
                className="rounded-md border border-prophet-line px-2 py-1.5 text-xs capitalize text-black"
              >
                {peer.teamId.replace(/-/g, " ")}
                {peer.fifaRank ? ` / #${peer.fifaRank}` : ""}
              </span>
            ))}
          </div>
        ) : (
          <TeamEmptyState
            title="Group pending"
            body="Official or curated group context is not attached yet."
          />
        )}
      </div>
    </section>
  );
}
