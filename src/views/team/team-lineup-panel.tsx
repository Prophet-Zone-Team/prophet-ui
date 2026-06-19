"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useTeamLineup } from "@/hooks/team/use-team-lineup";
import {
  buildLineupPlacementMap,
  type TeamLineupPlayerView
} from "@/lib/team/map-team-lineup";
import { getInitials, shortenName } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamLineupPanelProps {
  teamName: string;
}

function PlayerAvatar({ player }: { player: TeamLineupPlayerView }) {
  return (
    <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-white/90 text-[9px] font-[500] text-[#125afc]">
      {player.number ?? getInitials(player.name)}
    </span>
  );
}

function LineupPitchSkeleton() {
  return (
    <div
      className="min-h-[280px] animate-pulse rounded-xl border border-[#65af14]/40 bg-[#ebebeb]/50"
      aria-hidden
    />
  );
}

export function TeamLineupPanel({ teamName }: TeamLineupPanelProps) {
  const t = useTranslations("teamDetail");
  const { lineup, isLoading } = useTeamLineup(teamName);
  const hasStarters = (lineup?.starters.length ?? 0) > 0;
  const placementByPlayerId = useMemo(
    () => buildLineupPlacementMap(lineup?.starters ?? []),
    [lineup?.starters]
  );

  return (
    <section className={teamPanelClass} aria-label={t("startingXIAria")}>
      <div className={teamPanelHeadClass}>
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className={teamPanelTitleClass}>{t("expectedStartingXI")}</h2>
          {lineup?.formation ? (
            <span className="text-xs text-prophet-muted">
              {lineup.formation}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-4 bg-gradient-to-b from-[#e8f5e0] to-[#d4edc4]">
        {isLoading ? (
          <LineupPitchSkeleton />
        ) : hasStarters && lineup ? (
          <div className="relative mx-auto min-h-[220px] w-full rounded-xl p-3 md:min-h-[280px] md:w-[700px]">
            {lineup.starters.map((player) => {
              const positionStyle = placementByPlayerId.get(player.playerId);

              return (
                <div
                  key={player.playerId}
                  className={
                    positionStyle
                      ? "absolute flex w-[96px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
                      : "flex flex-col items-center justify-center text-center"
                  }
                  style={positionStyle}
                >
                  <PlayerAvatar player={player} />
                  <strong className="mt-1 max-w-[96px] truncate text-[10px] font-[500] text-black">
                    {shortenName(player.name)}
                    {player.position ? (
                      <span className="ml-1 font-[400] text-prophet-muted">
                        {player.position}
                      </span>
                    ) : null}
                  </strong>
                </div>
              );
            })}
          </div>
        ) : (
          <TeamEmptyState
            title={t("startingXIPending")}
            body={t("startingXIPendingBody")}
          />
        )}
      </div>
    </section>
  );
}
