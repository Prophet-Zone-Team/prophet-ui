import type { RoadToFinalBracket, RoadToFinalTeam } from "./types";

/** Total teams in the World Cup knockout field (32 → 16 in Round of 16). */
export const ROAD_TO_FINAL_TEAM_COUNT = 32;

const teams = {
  brazil: { id: "brazil", teamCode: "BRA", teamName: "Brazil" },
  morocco: { id: "morocco", teamCode: "MAR", teamName: "Morocco" },
  spain: { id: "spain", teamCode: "ESP", teamName: "Spain" },
  uruguay: { id: "uruguay", teamCode: "URU", teamName: "Uruguay" },
  france: { id: "france", teamCode: "FRA", teamName: "France" },
  senegal: { id: "senegal", teamCode: "SEN", teamName: "Senegal" },
  germany: { id: "germany", teamCode: "GER", teamName: "Germany" },
  ecuador: { id: "ecuador", teamCode: "ECU", teamName: "Ecuador" },
  england: { id: "england", teamCode: "ENG", teamName: "England" },
  croatia: { id: "croatia", teamCode: "CRO", teamName: "Croatia" },
  argentina: { id: "argentina", teamCode: "ARG", teamName: "Argentina" },
  austria: { id: "austria", teamCode: "AUT", teamName: "Austria" },
  portugal: { id: "portugal", teamCode: "POR", teamName: "Portugal" },
  colombia: { id: "colombia", teamCode: "COL", teamName: "Colombia" },
  netherlands: { id: "netherlands", teamCode: "NED", teamName: "Netherlands" },
  japan: { id: "japan", teamCode: "JPN", teamName: "Japan" }
} satisfies Record<string, RoadToFinalTeam>;

/**
 * Mock snapshot: full 2026 World Cup knockout prediction.
 * R16 → QF → SF → Final, France beats Argentina in the final.
 */
export const roadToFinalBracket: RoadToFinalBracket = {
  r16: [
    teams.brazil,
    teams.morocco,
    teams.spain,
    teams.uruguay,
    teams.france,
    teams.senegal,
    teams.germany,
    teams.ecuador,
    teams.england,
    teams.croatia,
    teams.argentina,
    teams.austria,
    teams.portugal,
    teams.colombia,
    teams.netherlands,
    teams.japan
  ],
  qf: [
    teams.brazil,
    teams.spain,
    teams.france,
    teams.germany,
    teams.england,
    teams.argentina,
    teams.portugal,
    teams.netherlands
  ],
  sf: [teams.brazil, teams.france, teams.argentina, teams.portugal],
  final: [teams.france, teams.argentina]
};
