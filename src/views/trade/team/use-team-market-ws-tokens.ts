"use client";

import { useRegisterMarketWsTokens } from "@/context/market-ws";
import type { TeamMarketSnapshot } from "@/types/market";

export function useTeamMarketWsTokens(
  snapshot: TeamMarketSnapshot,
  enabled: boolean
): void {
  const yesTokenId = snapshot.market.polymarket?.tokens.yes?.tokenId;
  const noTokenId = snapshot.market.polymarket?.tokens.no?.tokenId;

  useRegisterMarketWsTokens("team-markets", [yesTokenId, noTokenId], {
    enabled: enabled && Boolean(yesTokenId || noTokenId),
  });
}
