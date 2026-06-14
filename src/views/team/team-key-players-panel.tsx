"use client";

import { useTranslations } from "next-intl";

import type { TeamLineupPlayerView } from "@/lib/team/map-team-lineup";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamKeyPlayersPanelProps {
  players: TeamLineupPlayerView[];
  isLoading?: boolean;
}

export function TeamKeyPlayersPanel({
  players,
  isLoading = false
}: TeamKeyPlayersPanelProps) {
  const t = useTranslations("teamDetail");
  const tCommon = useTranslations("common");

  return (
    <section className={teamPanelClass} aria-label={t("keyPlayersAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("keyPlayers")}</h2>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {isLoading ? (
          <div className="sm:col-span-2 py-6 text-center text-sm text-prophet-muted">
            {tCommon("loading")}
          </div>
        ) : players.length > 0 ? (
          players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-prophet-line bg-[#fafbfc] px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm font-[500] text-black">
                {player.name}
              </span>
              <span className="shrink-0 text-xs text-prophet-muted">
                {t("playerNo")} {player.number}
              </span>
            </div>
          ))
        ) : (
          <div className="sm:col-span-2">
            <TeamEmptyState
              title={t("noKeyPlayers")}
              body={t("noKeyPlayersBody")}
            />
          </div>
        )}
      </div>
    </section>
  );
}
