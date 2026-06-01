import { landingPageContent } from "@/data/mock/landing";

import { LandingTopbar } from "./landing-topbar";
import { LandingDashboard } from "./marketing/landing-dashboard";
import { LandingFooter } from "./marketing/landing-footer";
import { LandingHero } from "./marketing/landing-hero";
import { LandingInfoGrid } from "./marketing/landing-info-grid";
import { LandingMatches } from "./marketing/landing-matches";
import { ReferralShell } from "./referral/referral-shell";

export function LandingPage() {
  const { nav, referral, marketing } = landingPageContent;

  return (
    <div className="page">
      <LandingTopbar nav={nav} />
      <main>
        <ReferralShell referral={referral} />
        {/* <LandingHero hero={marketing.hero} />
        <LandingDashboard
          teams={marketing.teams}
          moreTeamsCount={marketing.moreTeamsCount}
          footnote={marketing.footnote}
          movements={marketing.movements}
        /> */}
        {/* <LandingMatches matches={marketing.matches} /> */}
        {/* <LandingInfoGrid
          workSteps={marketing.workSteps}
          signalTaxonomy={marketing.signalTaxonomy}
          whyItems={marketing.whyItems}
        /> */}
        {/* <LandingFooter
          title={marketing.footerTitle}
          highlight={marketing.footerHighlight}
          categories={marketing.categories}
        /> */}
      </main>
    </div>
  );
}
