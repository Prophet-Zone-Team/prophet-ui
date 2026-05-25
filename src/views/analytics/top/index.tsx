import { TopAnalyticsCard } from "@/views/analytics/top/card";
import {
  ChampionIcon,
  DarkHorseIcon,
  HardestPathIcon,
  TopAdvantageIcon
} from "./icons";

export function AnalyticsTopSection() {
  return (
    <section aria-label="Top analytics highlights" className="flex gap-[20px]">
      <TopAnalyticsCard
        icon={<ChampionIcon />}
        categoryLabel="Most Likely Champion"
        teamCode="BRA"
        teamName="Brazil"
        description="Deep squad depth and outstanding big match experience"
      />
      <TopAnalyticsCard
        icon={<DarkHorseIcon />}
        categoryLabel="Dark Horse"
        teamCode="ARG"
        teamName="Argentina"
        description="Solid defense, dangerous on the counter"
      />
      <TopAnalyticsCard
        icon={<HardestPathIcon />}
        categoryLabel="Hardest Path"
        teamCode="GER"
        teamName="Germany"
        description="Potentially facing several top teams"
      />
      <TopAnalyticsCard
        icon={<TopAdvantageIcon />}
        categoryLabel="Top Advantage"
        teamCode="ENG"
        teamName="England"
        description="Excelent squad recovery and chemisty, strong momentum boost"
      />
    </section>
  );
}
