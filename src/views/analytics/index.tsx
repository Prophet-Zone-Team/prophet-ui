import { AnalyticsTopSection } from "./top";
import { TeamPowerRanking } from "./team-power-ranking";
import { Simulator } from "./simulator";
import { GroupCompetitiveness } from "./group-competitiveness";
import { SignalNewsImpact } from "./news";

export default function Analytics() {
  return (
    <div className="w-[1408px] mx-auto items-center gap-[20px] px-4 pt-[30px] pb-8">
      <AnalyticsTopSection />
      <div className="mt-[20px] flex gap-[20px]">
        <TeamPowerRanking />
        <Simulator />
      </div>
      <div className="mt-[20px] flex gap-[20px]">
        <SignalNewsImpact />
        <GroupCompetitiveness />
      </div>
    </div>
  );
}
