import teams from "@/data/teams";

export function resolvePickTeamFromMarketTitle(marketTitle: string): any {
  return teams[marketTitle as keyof typeof teams];
}
