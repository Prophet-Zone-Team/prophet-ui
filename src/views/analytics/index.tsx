import { AnalyticsTopSection } from "./top";
import { TeamPowerRanking } from "./team-power-ranking";
import { Simulator } from "./simulator";
import { GroupCompetitiveness } from "./group-competitiveness";
import { SignalNewsImpact } from "./news";

export default function Analytics() {
  return (
    <div className="w-full md:w-[1408px] mx-auto items-center gap-4 md:gap-5 px-3 md:px-4 pt-[30px] pb-8">
      <AnalyticsTopSection />
      <div className="mt-[20px] flex flex-col md:flex-row gap-4 md:gap-[20px]">
        <TeamPowerRanking />
        <Simulator />
      </div>
      <div className="mt-[20px] flex flex-col md:flex-row gap-4 md:gap-[20px]">
        <SignalNewsImpact />
        <GroupCompetitiveness />
      </div>
    </div>
  );
}
