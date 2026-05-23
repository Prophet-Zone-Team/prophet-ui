import type {
  GameMarketSnapshot,
  TeamMarketSnapshot
} from "@/types/market";
import { GameMarketSection } from "@/views/trade/simple/market-section/game-market-section";
import { TeamMarketSection } from "@/views/trade/simple/market-section/team-market-section";

export type TradeSimpleMarketSectionGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type TradeSimpleMarketSectionTeamProps = {
  variant: "team";
  snapshot: TeamMarketSnapshot;
};

export type TradeSimpleMarketSectionProps =
  | TradeSimpleMarketSectionGameProps
  | TradeSimpleMarketSectionTeamProps;

export function TradeSimpleMarketSection(
  props: TradeSimpleMarketSectionProps
) {
  if (props.variant === "game") {
    return (
      <GameMarketSection
        snapshot={props.gameSnapshot}
        teamSnapshots={props.teamSnapshots}
      />
    );
  }

  return <TeamMarketSection snapshot={props.snapshot} />;
}
