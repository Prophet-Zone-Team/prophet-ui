import type { KeyPlayerView } from "@/lib/team/team-detail-model";
import type { TeamDetailGroupPeer } from "@/lib/team/map-team-detail";
import { DossierGroupContext } from "@/views/team/dossier-group-context";
import { DossierKeyStars } from "@/views/team/dossier-key-stars";
import { DossierRecentForm } from "@/views/team/dossier-recent-form";
import { teamDossierStripClass } from "@/views/team/team-detail-ui";

export interface DossierStripProps {
  formResults: string[];
  latestLabel?: string;
  groupLabel?: string;
  peers: TeamDetailGroupPeer[];
  keyStars: KeyPlayerView[];
}

export function DossierStrip({
  formResults,
  latestLabel,
  groupLabel,
  peers,
  keyStars
}: DossierStripProps) {
  return (
    <section className={teamDossierStripClass} aria-label="Football dossier quick scan">
      <DossierRecentForm formResults={formResults} latestLabel={latestLabel} />
      <DossierGroupContext groupLabel={groupLabel} peers={peers} />
      <DossierKeyStars players={keyStars} />
    </section>
  );
}
