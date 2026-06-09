import type { MatchHistoryTeamOption } from "./types";

export const tradeGameMatchHistoryTeams: MatchHistoryTeamOption[] = [
  {
    id: "net",
    code: "NET",
    flagCode: "NED",
    name: "Netherlands",
    matches: [
      {
        id: "net-2022-11-21",
        playedAt: "2022-11-21",
        format: "Group Stage 1",
        homeCode: "NET",
        awayCode: "SEN",
        homeScore: 2,
        awayScore: 0,
        result: "win"
      },
      {
        id: "net-2022-11-25",
        playedAt: "2022-11-25",
        format: "Group Stage 2",
        homeCode: "NET",
        awayCode: "ECU",
        homeScore: 1,
        awayScore: 1,
        result: "draw"
      },
      {
        id: "net-2022-11-29",
        playedAt: "2022-11-29",
        format: "Group Stage 3",
        homeCode: "NET",
        awayCode: "QAT",
        homeScore: 2,
        awayScore: 0,
        result: "win"
      },
      {
        id: "net-2022-12-03",
        playedAt: "2022-12-03",
        format: "Round of 16",
        homeCode: "NET",
        awayCode: "USA",
        homeScore: 3,
        awayScore: 1,
        result: "win"
      },
      {
        id: "net-2022-12-09",
        playedAt: "2022-12-09",
        format: "Quarter-finals",
        homeCode: "NET",
        awayCode: "ARG",
        homeScore: 2,
        awayScore: 2,
        penaltyScore: "3-4",
        result: "lost-penalties"
      }
    ]
  },
  {
    id: "nor",
    code: "NOR",
    flagCode: "NOR",
    name: "Norway",
    matches: [
      {
        id: "nor-2022-11-22",
        playedAt: "2022-11-22",
        format: "Group Stage 1",
        homeCode: "NOR",
        awayCode: "MAR",
        homeScore: 0,
        awayScore: 0,
        result: "draw"
      },
      {
        id: "nor-2022-11-26",
        playedAt: "2022-11-26",
        format: "Group Stage 2",
        homeCode: "NOR",
        awayCode: "ESP",
        homeScore: 1,
        awayScore: 3,
        result: "lose"
      },
      {
        id: "nor-2022-11-30",
        playedAt: "2022-11-30",
        format: "Group Stage 3",
        homeCode: "NOR",
        awayCode: "CRC",
        homeScore: 2,
        awayScore: 1,
        result: "win"
      }
    ]
  }
];
