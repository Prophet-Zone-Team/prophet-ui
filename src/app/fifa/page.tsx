import { isPrivateModeHost } from "@/config/funding";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import { HomeWinnerPanel, sortHomeTeams } from "@/views/home";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FifaWinnerPage() {
  const marketData = await getWorldCupMarketData({
    includeFootballContext: false,
    includeNews: false,
    includeOdds: false
  });
  const teams = sortHomeTeams(marketData.snapshots);

  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isPrivateModeHost(hostname)) {
    redirect("/private");
  }

  return (
    <HomeWinnerPanel
      teams={teams}
      dataStatus={marketData.meta}
      probabilityHistory={marketData.probabilityHistory}
    />
  );
}
