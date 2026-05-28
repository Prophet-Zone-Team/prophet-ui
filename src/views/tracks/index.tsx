import type { MarketDataMeta } from "@/data/providers/types";
import { mockTeamMarketData, mockTeams } from "@/data/mock/teams";
import type {
  Team,
  TeamMarketData,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { TracksEmptyState } from "./empty";
import TracksTitle from "./title";
import { TrackCard, type TrackCardSignalItem } from "./track-card";
import {
  TopAttentionCard,
  type TopAttentionCardProps
} from "./top-attention-card";
import TracksTelegramBanner from "./tg";

type TopAttentionTeamTestCard = Extract<
  TopAttentionCardProps,
  { variant?: "team" }
> & {
  key: string;
};

function snapshotFor(
  teamId: string,
  marketOverrides?: Partial<TeamMarketData>
): TeamMarketSnapshot {
  const team = mockTeams.find((entry) => entry.id === teamId);
  const market = mockTeamMarketData.find((entry) => entry.teamId === teamId);

  if (!team || !market) {
    throw new Error(`Missing mock market data for team: ${teamId}`);
  }

  return {
    team,
    market: { ...market, ...marketOverrides }
  };
}

const TOP_ATTENTION_TEAM_TEST_CARDS: TopAttentionTeamTestCard[] = [
  {
    key: "brazil",
    snapshot: snapshotFor("brazil", {
      probability: 18.2,
      volume: 27_800_000
    }),
    attention: 5462,
    badge: "most_popular"
  },
  {
    key: "argentina",
    snapshot: snapshotFor("argentina", {
      probability: 18.4,
      volume: 18_420_000
    }),
    attention: 4891,
    badge: "highest_volume"
  },
  {
    key: "france",
    snapshot: snapshotFor("france", {
      probability: 17.2,
      volume: 17_650_000
    }),
    attention: 3724,
    badge: "dark_horse"
  },
  {
    key: "england",
    snapshot: snapshotFor("england", {
      probability: 12.9,
      volume: 13_180_000
    }),
    attention: 2910,
    badge: "top_probability"
  }
];

const MOCK_TOP_ATTENTION_MATCH: Extract<
  TopAttentionCardProps,
  { variant: "match" }
> = {
  variant: "match",
  match: {
    id: "mock-tracks-bra-arg",
    matchId: 99001,
    stage: "GROUP",
    group: "C",
    homeTeamId: "brazil",
    awayTeamId: "argentina",
    status: "scheduled",
    kickoffAt: "2026-06-15T19:00:00.000Z",
    freshness: {
      source: "mock",
      status: "cached",
      lastUpdated: "2026-05-11T10:00:00.000Z"
    },
    odds: {
      source: "polymarket",
      status: "cached",
      outcomes: [
        { label: "Brazil", impliedProbability: 42 },
        { label: "Draw", impliedProbability: 28 },
        { label: "Argentina", impliedProbability: 30 }
      ]
    }
  } satisfies WorldCupMatch,
  homeTeam: mockTeams.find((team) => team.id === "brazil")!,
  awayTeam: mockTeams.find((team) => team.id === "argentina")!,
  attention: 4102,
  volume: 8_420_000,
  probability: 42
};

const TRACK_CARD_DEMO_SIGNALS: TrackCardSignalItem[] = [
  {
    id: "track-signal-1",
    headline: "Spain at the 2026 FIFA World Cup: Squad, Schedul...",
    sentiment: "positive",
    thumbnailAlt: "Spain squad"
  },
  {
    id: "track-signal-2",
    headline: "Spain leave Real Madrid players out of final 26-man 2026 Wo...",
    sentiment: "negative",
    thumbnailAlt: "Spain squad selection"
  },
  {
    id: "track-signal-3",
    headline: "Umtiti gets France dancing and walking",
    sentiment: "positive",
    thumbnailAlt: "France training"
  }
];

const MOCK_TRACK_GAME_MATCH: WorldCupMatch = {
  id: "mock-tracks-ned-nor",
  matchId: 99002,
  stage: "GROUP",
  group: "F",
  homeTeamId: "netherlands",
  awayTeamId: "norway",
  status: "scheduled",
  kickoffAt: "2026-06-17T20:00:00.000Z",
  freshness: {
    source: "mock",
    status: "cached",
    lastUpdated: "2026-05-11T10:00:00.000Z"
  }
};

const MOCK_TRACK_GAME_ONGOING_MATCH: WorldCupMatch = {
  id: "mock-tracks-bra-arg-live",
  matchId: 99003,
  stage: "GROUP",
  group: "C",
  homeTeamId: "brazil",
  awayTeamId: "argentina",
  status: "live",
  kickoffAt: "2026-06-15T19:00:00.000Z",
  homeScore: 1,
  awayScore: 0,
  freshness: {
    source: "mock",
    status: "live",
    lastUpdated: "2026-05-27T12:00:00.000Z"
  }
};

function teamById(teamId: string): Team {
  const team = mockTeams.find((entry) => entry.id === teamId);

  if (!team) {
    throw new Error(`Missing mock team: ${teamId}`);
  }

  return team;
}

export type TracksViewProps = {
  snapshots: TeamMarketSnapshot[];
  matches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
};

export function TracksView({
  snapshots: _snapshots,
  matches: _matches,
  dataStatus: _dataStatus
}: TracksViewProps) {
  const spainSnapshot = snapshotFor("spain", {
    probability: 18.1,
    change24h: 0.36,
    volume: 27_800_000
  });
  const netherlands = teamById("netherlands");
  const norway = teamById("norway");
  const brazil = teamById("brazil");
  const argentina = teamById("argentina");

  return (
    <section className="mx-auto w-full max-w-[1406px] px-3 py-6 md:px-4 md:py-8">
      <TracksTitle />
      <div className="mt-4 flex flex-col gap-3 md:mt-6">
        <TrackCard
          snapshot={spainSnapshot}
          powerRanking={{ rank: 3 }}
          signals={{ count: 3, positiveCount: 3 }}
          signalItems={TRACK_CARD_DEMO_SIGNALS}
          youBid={{ amountLabel: "$88.88", outcomeSide: "no" }}
        />
        <TrackCard
          variant="game"
          match={MOCK_TRACK_GAME_MATCH}
          homeTeam={netherlands}
          awayTeam={norway}
          probability={58.1}
          probabilityTeamCode="NED"
          volume={27_800_000}
          powerRanking={{
            home: { team: netherlands, rank: 8 },
            away: { team: norway, rank: 17 }
          }}
          signals={{ count: 2 }}
          signalItems={TRACK_CARD_DEMO_SIGNALS.slice(0, 2)}
          youBid={{ amountLabel: "$0" }}
        />
        <TrackCard
          variant="game"
          match={MOCK_TRACK_GAME_ONGOING_MATCH}
          homeTeam={brazil}
          awayTeam={argentina}
          probability={42.0}
          probabilityTeamCode="BRA"
          volume={31_200_000}
          powerRanking={{
            home: { team: brazil, rank: 1 },
            away: { team: argentina, rank: 2 }
          }}
          signals={{ count: 3, positiveCount: 2 }}
          signalItems={TRACK_CARD_DEMO_SIGNALS}
          youBid={{ amountLabel: "$120.00", outcomeSide: "yes" }}
        />
      </div>
      <TracksEmptyState />
      <TracksTelegramBanner />
      <div className="mt-5 text-base font-[500] text-black md:mt-4 md:text-[18px]">
        Top Attention
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-4 lg:flex lg:flex-wrap lg:gap-2">
        {TOP_ATTENTION_TEAM_TEST_CARDS.map((card) => (
          <TopAttentionCard
            key={card.key}
            snapshot={card.snapshot}
            attention={card.attention}
            badge={card.badge}
          />
        ))}
        <TopAttentionCard {...MOCK_TOP_ATTENTION_MATCH} />
      </div>
    </section>
  );
}
