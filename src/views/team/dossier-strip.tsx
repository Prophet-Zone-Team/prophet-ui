"use client";

import { useTranslations } from "next-intl";

import type { KeyPlayerView, RecentMatchView } from "@/lib/team/team-detail-model";
import type { TeamDetailGroupPeer } from "@/lib/team/map-team-detail";
import { DossierGroupContext } from "@/views/team/dossier-group-context";
import { DossierKeyStars } from "@/views/team/dossier-key-stars";
import { teamDossierStripClass } from "@/views/team/team-detail-ui";
import { TeamRecentMatchesPanel } from "./team-recent-matches-panel";

export interface DossierStripProps {
  groupLabel?: string;
  peers: TeamDetailGroupPeer[];
  keyStars: KeyPlayerView[];
  recentMatches?: RecentMatchView[];
}

export function DossierStrip({
  groupLabel,
  peers,
  keyStars,
  recentMatches,
}: DossierStripProps) {
  const t = useTranslations("teamDetail");

  return (
    <section className={teamDossierStripClass} aria-label={t("dossierStripAria")}>
      <TeamRecentMatchesPanel matches={recentMatches ?? []} />
      <DossierGroupContext groupLabel={groupLabel} peers={peers} />
      <DossierKeyStars players={keyStars} />
    </section>
  );
}
