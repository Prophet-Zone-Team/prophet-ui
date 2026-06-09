import type {
  NewsEvent,
  ProbabilityHistoryPoint,
  Team,
  TeamMarketData,
  TeamMarketSnapshot,
  UserWatchlistItem,
} from "@/types/market";

export const mockTeams: Team[] = [
  {
    id: "argentina",
    name: "Argentina",
    code: "ARG",
    region: "South America",
    group: "A",
    fifaRank: 1
  },
  {
    id: "france",
    name: "France",
    code: "FRA",
    region: "Europe",
    group: "B",
    fifaRank: 2
  },
  {
    id: "brazil",
    name: "Brazil",
    code: "BRA",
    region: "South America",
    group: "C",
    fifaRank: 5
  },
  {
    id: "england",
    name: "England",
    code: "ENG",
    region: "Europe",
    group: "D",
    fifaRank: 4
  },
  {
    id: "spain",
    name: "Spain",
    code: "ESP",
    region: "Europe",
    group: "E",
    fifaRank: 3
  },
  {
    id: "germany",
    name: "Germany",
    code: "GER",
    region: "Europe",
    group: "F",
    fifaRank: 10
  },
  {
    id: "portugal",
    name: "Portugal",
    code: "POR",
    region: "Europe",
    group: "G",
    fifaRank: 6
  },
  {
    id: "netherlands",
    name: "Netherlands",
    code: "NED",
    region: "Europe",
    group: "H",
    fifaRank: 7
  },
  {
    id: "norway",
    name: "Norway",
    code: "NOR",
    region: "Europe",
    group: "I",
    fifaRank: 22
  },
  {
    id: "italy",
    name: "Italy",
    code: "ITA",
    region: "Europe",
    group: "A",
    fifaRank: 9
  },
  {
    id: "belgium",
    name: "Belgium",
    code: "BEL",
    region: "Europe",
    group: "B",
    fifaRank: 8
  },
  {
    id: "uruguay",
    name: "Uruguay",
    code: "URU",
    region: "South America",
    group: "C",
    fifaRank: 11
  },
  {
    id: "croatia",
    name: "Croatia",
    code: "CRO",
    region: "Europe",
    group: "D",
    fifaRank: 12
  },
  {
    id: "usa",
    name: "United States",
    code: "USA",
    region: "North America",
    group: "E",
    fifaRank: 16
  },
  {
    id: "mexico",
    name: "Mexico",
    code: "MEX",
    region: "North America",
    group: "F",
    fifaRank: 14
  },
  {
    id: "japan",
    name: "Japan",
    code: "JPN",
    region: "Asia",
    group: "G",
    fifaRank: 18
  },
  {
    id: "morocco",
    name: "Morocco",
    code: "MAR",
    region: "Africa",
    group: "H",
    fifaRank: 13
  },
  {
    id: "colombia",
    name: "Colombia",
    code: "COL",
    region: "South America",
    group: "A",
    fifaRank: 15
  },
  {
    id: "denmark",
    name: "Denmark",
    code: "DEN",
    region: "Europe",
    group: "B",
    fifaRank: 20
  },
  {
    id: "switzerland",
    name: "Switzerland",
    code: "SUI",
    region: "Europe",
    group: "C",
    fifaRank: 19
  },
  {
    id: "senegal",
    name: "Senegal",
    code: "SEN",
    region: "Africa",
    group: "D",
    fifaRank: 17
  },
  {
    id: "south-korea",
    name: "South Korea",
    code: "KOR",
    region: "Asia",
    group: "E",
    fifaRank: 23
  },
  {
    id: "australia",
    name: "Australia",
    code: "AUS",
    region: "Asia",
    group: "F",
    fifaRank: 24
  },
  {
    id: "canada",
    name: "Canada",
    code: "CAN",
    region: "North America",
    group: "G",
    fifaRank: 31
  },
  {
    id: "ghana",
    name: "Ghana",
    code: "GHA",
    region: "Africa",
    group: "H",
    fifaRank: 28
  }
];

export const mockTeamMarketData: TeamMarketData[] = [
  {
    teamId: "argentina",
    probability: 18.4,
    change24h: 1.8,
    change7d: 4.6,
    volume: 18420000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 15.9,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "france",
    probability: 17.2,
    change24h: -0.7,
    change7d: 1.2,
    volume: 17650000,
    sentiment: "volatile",
    bookmakerImpliedProbability: 18.6,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "brazil",
    probability: 15.8,
    change24h: 2.4,
    change7d: 5.8,
    volume: 15930000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 13.1,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "england",
    probability: 12.9,
    change24h: -1.5,
    change7d: -3.4,
    volume: 13180000,
    sentiment: "bearish",
    bookmakerImpliedProbability: 15.2,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "spain",
    probability: 11.7,
    change24h: 0.4,
    change7d: 2.1,
    volume: 11440000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 11.1,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "germany",
    probability: 9.8,
    change24h: 1.2,
    change7d: -0.8,
    volume: 10270000,
    sentiment: "volatile",
    bookmakerImpliedProbability: 8.4,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "portugal",
    probability: 8.9,
    change24h: -0.3,
    change7d: 0.9,
    volume: 9180000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 9.6,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "netherlands",
    probability: 7.6,
    change24h: 0.9,
    change7d: 2.7,
    volume: 7440000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 6.2,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "norway",
    probability: 3.2,
    change24h: 0.5,
    change7d: 1.1,
    volume: 4120000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 2.8,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "italy",
    probability: 6.4,
    change24h: -2.1,
    change7d: -4.9,
    volume: 6800000,
    sentiment: "bearish",
    bookmakerImpliedProbability: 8.3,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "belgium",
    probability: 5.7,
    change24h: -0.9,
    change7d: -2.2,
    volume: 5220000,
    sentiment: "bearish",
    bookmakerImpliedProbability: 6.7,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "uruguay",
    probability: 5.1,
    change24h: 1.6,
    change7d: 3.9,
    volume: 4890000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 3.8,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "croatia",
    probability: 4.2,
    change24h: -0.5,
    change7d: -1.4,
    volume: 3770000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 4.9,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "usa",
    probability: 3.9,
    change24h: 1.1,
    change7d: 4.2,
    volume: 8310000,
    sentiment: "volatile",
    bookmakerImpliedProbability: 2.4,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "mexico",
    probability: 3.1,
    change24h: -1.8,
    change7d: -3.8,
    volume: 6420000,
    sentiment: "bearish",
    bookmakerImpliedProbability: 4.5,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "japan",
    probability: 2.9,
    change24h: 0.8,
    change7d: 2.9,
    volume: 3940000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 1.8,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "morocco",
    probability: 2.7,
    change24h: -0.2,
    change7d: 1.5,
    volume: 3620000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 3.4,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "colombia",
    probability: 2.6,
    change24h: 0.6,
    change7d: 1.8,
    volume: 3160000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 2.1,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "denmark",
    probability: 2.1,
    change24h: -0.4,
    change7d: -1.1,
    volume: 2410000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 2.8,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "switzerland",
    probability: 1.8,
    change24h: 0.2,
    change7d: -0.6,
    volume: 1940000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 2.2,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "senegal",
    probability: 1.6,
    change24h: 0.7,
    change7d: 1.9,
    volume: 1810000,
    sentiment: "bullish",
    bookmakerImpliedProbability: 1.1,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "south-korea",
    probability: 1.2,
    change24h: -0.6,
    change7d: -1.7,
    volume: 1560000,
    sentiment: "bearish",
    bookmakerImpliedProbability: 1.9,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "australia",
    probability: 0.9,
    change24h: 0.1,
    change7d: -0.2,
    volume: 980000,
    sentiment: "neutral",
    bookmakerImpliedProbability: 1.3,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "canada",
    probability: 0.8,
    change24h: 0.5,
    change7d: 1.4,
    volume: 2120000,
    sentiment: "volatile",
    bookmakerImpliedProbability: 0.5,
    updatedAt: "2026-05-11T10:00:00.000Z"
  },
  {
    teamId: "ghana",
    probability: 0.6,
    change24h: -0.3,
    change7d: -0.9,
    volume: 870000,
    sentiment: "bearish",
    bookmakerImpliedProbability: 1,
    updatedAt: "2026-05-11T10:00:00.000Z"
  }
];

export const mockNewsEvents: NewsEvent[] = [
  {
    id: "news-argentina-midfield-return",
    teamId: "argentina",
    headline: "Argentina midfield starter returns to full training",
    source: "Mock Market Desk",
    publishedAt: "2026-05-11T08:10:00.000Z",
    impactScore: 72,
    summary: "Market activity moved higher after reports of improved squad availability.",
  },
  {
    id: "news-brazil-attacking-form",
    teamId: "brazil",
    headline: "Brazil attack draws stronger sentiment after recent friendly form",
    source: "Mock Market Desk",
    publishedAt: "2026-05-10T22:30:00.000Z",
    impactScore: 81,
    summary: "Trading interest increased alongside stronger market confidence in Brazil's scoring profile.",
  },
  {
    id: "news-england-defensive-depth",
    teamId: "england",
    headline: "England defensive depth questioned after injury update",
    source: "Mock Market Desk",
    publishedAt: "2026-05-10T17:45:00.000Z",
    impactScore: -64,
    summary: "The market moved lower as traders repriced defensive availability risk.",
  },
  {
    id: "news-usa-home-interest",
    teamId: "usa",
    headline: "United States volume rises on home-tournament attention",
    source: "Mock Market Desk",
    publishedAt: "2026-05-11T06:20:00.000Z",
    impactScore: 58,
    summary: "Volume is elevated relative to probability, suggesting attention-driven demand.",
  },
  {
    id: "news-france-forward-rotation",
    teamId: "france",
    headline: "France market turns choppy as forward rotation debate widens",
    source: "Mock Market Desk",
    publishedAt: "2026-05-11T04:35:00.000Z",
    impactScore: -28,
    summary: "Short-term pricing softened while bookmaker implied probability remains elevated.",
  },
  {
    id: "news-italy-qualification-risk",
    teamId: "italy",
    headline: "Italy drift continues after defensive availability concerns",
    source: "Mock Market Desk",
    publishedAt: "2026-05-09T19:20:00.000Z",
    impactScore: -69,
    summary: "The market has reduced Italy's probability more aggressively than bookmaker pricing.",
  },
  {
    id: "news-japan-transition-pace",
    teamId: "japan",
    headline: "Japan attracts long-shot interest around transition pace",
    source: "Mock Market Desk",
    publishedAt: "2026-05-10T13:05:00.000Z",
    impactScore: 44,
    summary: "Probability and sentiment moved higher from a low base as volume improved.",
  },
];

export const mockWatchlist: UserWatchlistItem[] = [
  {
    id: "watch-argentina",
    teamId: "argentina",
    addedAt: "2026-05-08T09:00:00.000Z",
    alertThreshold: 20,
    notes: "Track momentum after squad news.",
  },
  {
    id: "watch-usa",
    teamId: "usa",
    addedAt: "2026-05-09T15:30:00.000Z",
    alertThreshold: 5,
    notes: "High volume relative to market probability.",
  },
  {
    id: "watch-japan",
    teamId: "japan",
    addedAt: "2026-05-10T11:45:00.000Z",
  },
];

export const mockProbabilityHistory: ProbabilityHistoryPoint[] = mockTeamMarketData.flatMap((market) =>
  createProbabilityHistory(market),
);

export const mockTeamMarketSnapshots: TeamMarketSnapshot[] = mockTeams.map((team) => {
  const market = mockTeamMarketData.find((item) => item.teamId === team.id);

  if (!market) {
    throw new Error(`Missing market data for team: ${team.id}`);
  }

  return { team, market };
});

function createProbabilityHistory(market: TeamMarketData): ProbabilityHistoryPoint[] {
  const points = 30;
  const currentDate = new Date("2026-05-11T00:00:00.000Z");
  const startProbability = clampProbability(
    market.probability - market.change7d - market.change24h * 0.6 - getTeamWave(market.teamId, 0),
  );

  return Array.from({ length: points }, (_, index) => {
    const daysFromStart = index;
    const date = new Date(currentDate);
    date.setUTCDate(currentDate.getUTCDate() - (points - 1 - index));

    const progress = daysFromStart / (points - 1);
    const trend = startProbability + (market.probability - startProbability) * progress;
    const wave = getTeamWave(market.teamId, index);
    const recentMove = index >= points - 2 ? market.change24h * (index - 27) * 0.34 : 0;

    return {
      teamId: market.teamId,
      date: date.toISOString().slice(0, 10),
      probability: clampProbability(trend + wave + recentMove),
    };
  });
}

function getTeamWave(teamId: string, index: number): number {
  const seed = [...teamId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const phase = seed % 9;
  const amplitude = 0.25 + (seed % 7) * 0.09;

  return Math.sin((index + phase) * 0.72) * amplitude + Math.cos((index + phase) * 0.28) * 0.18;
}

function clampProbability(value: number): number {
  return Math.round(Math.max(0.2, Math.min(28, value)) * 10) / 10;
}
