import type { RoadToFinalBracket, RoadToFinalTeam } from "./types";

/** Total teams in the World Cup knockout field (32 → 16 in Round of 16). */
export const ROAD_TO_FINAL_TEAM_COUNT = 32;

const teams = {
  brazil: { id: "brazil", teamCode: "BRA", teamName: "Brazil" },
  france: { id: "france", teamCode: "FRA", teamName: "France" },
  spain: { id: "spain", teamCode: "ESP", teamName: "Spain" },
  england: { id: "england", teamCode: "ENG", teamName: "England" },
  argentina: { id: "argentina", teamCode: "ARG", teamName: "Argentina" },
  germany: { id: "germany", teamCode: "GER", teamName: "Germany" },
  portugal: { id: "portugal", teamCode: "POR", teamName: "Portugal" },
  netherlands: { id: "netherlands", teamCode: "NED", teamName: "Netherlands" },
  usa: { id: "usa", teamCode: "USA", teamName: "United States" },
  mexico: { id: "mexico", teamCode: "MEX", teamName: "Mexico" },
  japan: { id: "japan", teamCode: "JPN", teamName: "Japan" },
  morocco: { id: "morocco", teamCode: "MAR", teamName: "Morocco" },
  colombia: { id: "colombia", teamCode: "COL", teamName: "Colombia" },
  croatia: { id: "croatia", teamCode: "CRO", teamName: "Croatia" },
  belgium: { id: "belgium", teamCode: "BEL", teamName: "Belgium" },
  uruguay: { id: "uruguay", teamCode: "URU", teamName: "Uruguay" }
} satisfies Record<string, RoadToFinalTeam>;

const empty = null;

/** Mock snapshot: 16 teams in R16, narrowing 16 → 8 → 4 → 2 toward the trophy. */
export const roadToFinalBracket: RoadToFinalBracket = {
  r16: [
    teams.brazil,
    teams.france,
    teams.spain,
    empty,
    teams.england,
    empty,
    teams.argentina,
    teams.germany,
    teams.portugal,
    teams.netherlands,
    empty,
    teams.usa,
    teams.mexico,
    teams.japan,
    empty,
    teams.morocco
  ],
  qf: [
    teams.brazil,
    empty,
    teams.england,
    empty,
    teams.argentina,
    empty,
    empty,
    empty
  ],
  sf: [teams.brazil, empty, empty, empty],
  final: [teams.brazil, empty]
};
