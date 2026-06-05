import type { NewsEvent, Team, TeamMarketSnapshot, WorldCupMatch } from "@/types/market";

export type TrackCardSentiment = "positive" | "negative";

export type TrackCardSignalItem = {
  id: string;
  headline: string;
  sentiment: TrackCardSentiment;
  thumbnailUrl?: string;
  thumbnailAlt: string;
};

export type TrackCardSignalsSummary = {
  count: number;
  positiveCount?: number;
};

export type TrackCardYouBid = {
  amountLabel: string;
  outcomeSide?: "yes" | "no";
};

export type TrackCardTeamPowerRanking = {
  rank: number | null;
};

export type TrackCardGamePowerRanking = {
  home: { team: Team; rank: number | null };
  away: { team: Team; rank: number | null };
};

export type TrackCardTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  powerRanking: TrackCardTeamPowerRanking;
  signals: TrackCardSignalsSummary;
  signalItems: TrackCardSignalItem[];
  youBid?: TrackCardYouBid;
  className?: string;
};

export type TrackCardGameProps = {
  variant: "game";
  match: WorldCupMatch;
  homeTeam: Team;
  awayTeam: Team;
  probability: number;
  probabilityTeamCode: string;
  volume: number;
  powerRanking: TrackCardGamePowerRanking;
  signals: TrackCardSignalsSummary;
  signalItems: TrackCardSignalItem[];
  youBid?: TrackCardYouBid;
  className?: string;
};

export type TrackCardProps = TrackCardTeamProps | TrackCardGameProps;

export function newsEventToTrackSignalItem(event: NewsEvent): TrackCardSignalItem {
  return {
    id: event.id,
    headline: event.headline,
    sentiment: event.impactScore >= 0 ? "positive" : "negative",
    thumbnailAlt: event.headline
  };
}
