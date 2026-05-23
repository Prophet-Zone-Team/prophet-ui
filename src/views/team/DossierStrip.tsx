import type {
  ApiFootballFixtureContext,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "../../types/market";
import type { KeyPlayerView, RecentMatchView } from "../../lib/team/teamDetailModel";
import { DossierGroupContext } from "./DossierGroupContext";
import { DossierKeyStars } from "./DossierKeyStars";
import { DossierNextFixture } from "./DossierNextFixture";
import { DossierRecentForm } from "./DossierRecentForm";
import { teamDossierStripClass } from "./teamDetailUi";

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
