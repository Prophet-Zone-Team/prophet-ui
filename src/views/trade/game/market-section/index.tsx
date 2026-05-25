import type {
  GameMarketSnapshot,
  TeamMarketSnapshot
} from "@/types/market";
import { GameMarketSection } from "@/views/trade/game/market-section/game-market-section";

export type TradeGameMarketSectionProps = {
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export function TradeGameMarketSection({
  gameSnapshot,
  teamSnapshots
}: TradeGameMarketSectionProps) {
  return (
    <GameMarketSection snapshot={gameSnapshot} teamSnapshots={teamSnapshots} />
  );
}
