"use client";

import { useTranslations } from "next-intl";

import type { KeyPlayerView } from "@/lib/team/team-detail-model";
import { getInitials } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface DossierKeyStarsProps {
  players: KeyPlayerView[];
}

export function DossierKeyStars({ players }: DossierKeyStarsProps) {
  const t = useTranslations("teamDetail");
  const stars = players.slice(0, 3);

  return (
    <section className={teamPanelClass} aria-label={t("keyStarsAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("keyStars")}</h2>
      </div>
      <div className="grid gap-2 p-4">
        {stars.length > 0 ? (
          stars.map((player) => (
            <div key={player.name} className="flex min-w-0 items-center gap-2">
              {player.logo ? (
                <img
                  src={player.logo}
                  alt=""
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f5f9ff] text-[10px] font-[500] text-[#125afc]">
                  {getInitials(player.name)}
                </span>
              )}
              <div className="min-w-0">
                <strong className="block truncate text-xs font-[500] text-black">
                  {player.name}
                </strong>
                <span className="block truncate text-[10px] text-prophet-muted">
                  {player.position}
                  {player.club ? ` / ${player.club}` : ""}
                </span>
              </div>
            </div>
          ))
        ) : (
          <TeamEmptyState
            title={t("noKeyStars")}
            body={t("noKeyStarsBody")}
          />
        )}
      </div>
    </section>
  );
}
