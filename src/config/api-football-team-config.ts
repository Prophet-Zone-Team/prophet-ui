import type { Team } from "@/types/market";

export interface ApiFootballTeamConfig {
  teamId: Team["id"];
  search: string;
  apiFootballTeamId?: number;
}

export const apiFootballTeamConfig: ApiFootballTeamConfig[] = [
  { teamId: "argentina", search: "Argentina", apiFootballTeamId: 26 },
  { teamId: "france", search: "France", apiFootballTeamId: 2 },
  { teamId: "brazil", search: "Brazil", apiFootballTeamId: 6 },
  { teamId: "england", search: "England", apiFootballTeamId: 10 },
  { teamId: "spain", search: "Spain", apiFootballTeamId: 9 },
  { teamId: "germany", search: "Germany", apiFootballTeamId: 25 },
  { teamId: "portugal", search: "Portugal", apiFootballTeamId: 27 },
  { teamId: "netherlands", search: "Netherlands", apiFootballTeamId: 1118 },
  { teamId: "italy", search: "Italy", apiFootballTeamId: 768 },
  { teamId: "belgium", search: "Belgium", apiFootballTeamId: 1 },
  { teamId: "uruguay", search: "Uruguay", apiFootballTeamId: 7 },
  { teamId: "croatia", search: "Croatia", apiFootballTeamId: 3 },
  { teamId: "usa", search: "USA", apiFootballTeamId: 2384 },
  { teamId: "mexico", search: "Mexico", apiFootballTeamId: 16 },
  { teamId: "japan", search: "Japan", apiFootballTeamId: 12 },
  { teamId: "morocco", search: "Morocco", apiFootballTeamId: 31 },
  { teamId: "colombia", search: "Colombia", apiFootballTeamId: 8 },
  { teamId: "denmark", search: "Denmark", apiFootballTeamId: 21 },
  { teamId: "switzerland", search: "Switzerland", apiFootballTeamId: 15 },
  { teamId: "senegal", search: "Senegal", apiFootballTeamId: 13 },
  { teamId: "south-korea", search: "South Korea", apiFootballTeamId: 17 },
  { teamId: "australia", search: "Australia", apiFootballTeamId: 20 },
  { teamId: "canada", search: "Canada", apiFootballTeamId: 5529 },
  { teamId: "ghana", search: "Ghana", apiFootballTeamId: 1504 },
  { teamId: "norway", search: "Norway" },
  { teamId: "tunisia", search: "Tunisia" },
  { teamId: "ecuador", search: "Ecuador" },
  { teamId: "paraguay", search: "Paraguay" },
  { teamId: "new-zealand", search: "New Zealand" },
  { teamId: "iran", search: "Iran" },
  { teamId: "uzbekistan", search: "Uzbekistan" },
  { teamId: "jordan", search: "Jordan" },
  { teamId: "south-africa", search: "South Africa" },
  { teamId: "ivory-coast", search: "Ivory Coast" },
  { teamId: "egypt", search: "Egypt" },
  { teamId: "algeria", search: "Algeria" },
  { teamId: "cape-verde", search: "Cape Verde" },
  { teamId: "qatar", search: "Qatar" },
  { teamId: "saudi-arabia", search: "Saudi Arabia" },
  { teamId: "scotland", search: "Scotland" },
  { teamId: "austria", search: "Austria" },
  { teamId: "haiti", search: "Haiti" },
  { teamId: "curacao", search: "Curacao" },
  { teamId: "panama", search: "Panama" },
  { teamId: "sweden", search: "Sweden" },
  { teamId: "congo-dr", search: "Congo DR" },
  { teamId: "iraq", search: "Iraq" },
  { teamId: "bosnia-herzegovina", search: "Bosnia and Herzegovina" },
  { teamId: "czechia", search: "Czechia" },
  { teamId: "turkiye", search: "Turkiye" },
];

export function getApiFootballTeamConfig(teamId: Team["id"]): ApiFootballTeamConfig | undefined {
  return apiFootballTeamConfig.find((config) => config.teamId === teamId);
}
