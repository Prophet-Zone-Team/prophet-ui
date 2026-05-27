import type { TrackCardGamePowerRanking, TrackCardSignalsSummary, TrackCardSignalItem, TrackCardTeamPowerRanking } from "../types";
import { PowerRankingMetric } from "./power-ranking";
import { SignalFeed } from "./signal-feed";
import { SignalsMetric } from "./signals-metric";

export type TrackCardFooterTeamProps = {
  variant: "team";
  signals: TrackCardSignalsSummary;
  powerRanking: TrackCardTeamPowerRanking;
  signalItems: TrackCardSignalItem[];
};

export type TrackCardFooterGameProps = {
  variant: "game";
  signals: TrackCardSignalsSummary;
  powerRanking: TrackCardGamePowerRanking;
  signalItems: TrackCardSignalItem[];
};

export type TrackCardFooterProps =
  | TrackCardFooterTeamProps
  | TrackCardFooterGameProps;

export function TrackCardFooter(props: TrackCardFooterProps) {
  const showPositiveLabel = props.variant === "team";

  return (
    <>
      <SignalsMetric
        signals={props.signals}
        showPositiveLabel={showPositiveLabel}
      />
      {props.variant === "team" ? (
        <PowerRankingMetric
          variant="team"
          powerRanking={props.powerRanking}
        />
      ) : (
        <PowerRankingMetric variant="game" powerRanking={props.powerRanking} />
      )}
      <SignalFeed items={props.signalItems} />
    </>
  );
}
