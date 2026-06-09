import { GameTrackCard } from "./game-track-card";
import { TeamTrackCard } from "./team-track-card";
import type { TrackCardProps } from "./types";

export function TrackCard(props: TrackCardProps) {
  if (props.variant === "game") {
    return <GameTrackCard {...props} />;
  }

  return <TeamTrackCard {...props} />;
}

export type {
  TrackCardGamePowerRanking,
  TrackCardGameProps,
  TrackCardProps,
  TrackCardSentiment,
  TrackCardSignalItem,
  TrackCardSignalsSummary,
  TrackCardTeamPowerRanking,
  TrackCardTeamProps,
  TrackCardYouBid
} from "./types";

export { newsEventToTrackSignalItem } from "./types";
