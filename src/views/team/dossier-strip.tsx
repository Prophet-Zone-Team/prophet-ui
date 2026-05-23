import type {
  ApiFootballFixtureContext,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "../../types/market";
import type { KeyPlayerView, RecentMatchView } from "../../lib/team/team-detail-model";
import { DossierGroupContext } from "./dossier-group-context";
import { DossierKeyStars } from "./dossier-key-stars";
import { DossierNextFixture } from "./dossier-next-fixture";
import { DossierRecentForm } from "./dossier-recent-form";
import { teamDossierStripClass } from "./team-detail-ui";

export interface DossierStripProps {
  snapshot: TeamMarketSnapshot;
  matches: RecentMatchView[];
  fixture?: ApiFootballFixtureContext;
  players: KeyPlayerView[];
  metadata?: TeamFootballMetadata;
  allMetadata: TeamFootballMetadata[];
}

export function DossierStrip({
  snapshot,
  matches,
  fixture,
  players,
  metadata,
  allMetadata
}: DossierStripProps) {
  return (
    <section className={teamDossierStripClass} aria-label="Football dossier quick scan">
      <DossierRecentForm matches={matches} />
      <DossierNextFixture fixture={fixture} snapshot={snapshot} />
      <DossierGroupContext metadata={metadata} allMetadata={allMetadata} />
      <DossierKeyStars players={players} metadata={metadata} />
    </section>
  );
}
