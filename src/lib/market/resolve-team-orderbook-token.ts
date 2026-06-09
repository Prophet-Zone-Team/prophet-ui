import type { OrderOutcomeSide, TeamMarketSnapshot } from "@/types/market";

export function resolveTeamOrderbookTokenId(
  snapshot: TeamMarketSnapshot,
  binarySide: OrderOutcomeSide
): string | undefined {
  return (
    snapshot.market.polymarket?.tokens[binarySide]?.tokenId ??
    snapshot.market.polymarket?.tokens.yes?.tokenId
  );
}
