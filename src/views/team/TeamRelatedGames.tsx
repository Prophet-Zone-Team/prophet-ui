"use client";

import { useMemo } from "react";

import { getRelatedMatchesForTeam } from "../../lib/team/relatedMatches";
import type { TeamMarketSnapshot, WorldCupMatch } from "../../types/market";
import { TeamRelatedGameCard } from "./TeamRelatedGameCard";
import {
  teamDetailPanelClass,
  teamDetailPanelTitleClass
} from "./teamDetailUi";

export interface TeamRelatedGamesProps {
  teamId: string;
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
}

export function TeamRelatedGames({
  teamId,
  matches,
  snapshots
}: TeamRelatedGamesProps) {
  const related = useMemo(
    () => getRelatedMatchesForTeam(teamId, matches).slice(0, 8),
    [matches, teamId]
  );

  return (
    <section className={teamDetailPanelClass} aria-label="Related games">
      <h2 className={`${teamDetailPanelTitleClass} px-4 py-3`}>
        Related Games
      </h2>

      {related.length > 0 ? (
        <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto px-3">
          {related.map((match) => (
            <TeamRelatedGameCard
              key={match.id}
              match={match}
              snapshots={snapshots}
              highlightTeamId={teamId}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          No related fixtures are scheduled for this team yet.
        </p>
      )}
    </section>
  );
}
