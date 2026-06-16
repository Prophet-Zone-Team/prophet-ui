"use client";

import { useMemo } from "react";

import { useMarketWsPrices } from "@/context/market-ws";
import { calculateReferencePrice } from "@/lib/market/order-math";
import type { TeamMarketSnapshot } from "@/types/market";

export function useTeamMobileOutcomePrices(
  snapshot: TeamMarketSnapshot,
  marketWsEnabled: boolean
) {
  const yesTokenId = snapshot.market.polymarket?.tokens.yes?.tokenId;
  const noTokenId = snapshot.market.polymarket?.tokens.no?.tokenId;

  const { pricesByTokenId: teamTokenPrices } = useMarketWsPrices(
    marketWsEnabled ? [yesTokenId, noTokenId] : []
  );

  return useMemo(() => {
    const yesPrice =
      (yesTokenId ? teamTokenPrices[yesTokenId]?.bestAsk : undefined) ??
      snapshot.market.polymarket?.tokens.yes?.price ??
      calculateReferencePrice(snapshot.market.probability, "yes");
    const noPrice =
      (noTokenId ? teamTokenPrices[noTokenId]?.bestAsk : undefined) ??
      snapshot.market.polymarket?.tokens.no?.price ??
      calculateReferencePrice(snapshot.market.probability, "no");

    return { yesPrice, noPrice };
  }, [noTokenId, snapshot, teamTokenPrices, yesTokenId]);
}
