import { unstable_cache } from "next/cache";

import type { GameTradeContext } from "@/app/trade/_shared/render-trade-page";
import { loadGameTradeContext } from "@/app/trade/_shared/render-trade-page";
import { resolveMatchSides } from "@/lib/market/schedule-match";

import {
  prepareGameShareCardData,
  renderGameShareCardPng,
} from "./render-game-share-card-pipeline";
import { resolveShareAssetOrigin } from "./resolve-share-asset-origin";
import { uploadShareImageServer } from "./upload-share-image-server";

const CACHE_REVALIDATE_SECONDS = 60 * 60;

export const GAME_SHARE_TWITTER_DESCRIPTION =
  "A World Cup prediction market data terminal with user-owned Polymarket order tooling.";

const getCachedGameShareImageUrl = unstable_cache(
  async (slug: string) => {
    const context = await loadGameTradeContext(slug);
    const origin = resolveShareAssetOrigin();
    const cardData = await prepareGameShareCardData(
      context.match,
      context.gameSnapshot,
      origin,
    );
    const pngBuffer = await renderGameShareCardPng(cardData, origin);
    const filename = `game-share-${slug}.png`;

    return uploadShareImageServer(pngBuffer, filename);
  },
  ["game-share-image-v7"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: ["game-share-image-v7"],
  },
);

export async function resolveGameShareImageUrl(
  context: GameTradeContext,
): Promise<string | null> {
  try {
    return await getCachedGameShareImageUrl(context.slug);
  } catch (error) {
    console.error("[game-share-image] Failed to generate share image", error);
    return null;
  }
}

export function resolveGameShareTitle(context: GameTradeContext): string {
  const sides = resolveMatchSides(context.match, []);
  return `${sides.home.name} vs ${sides.away.name}`;
}
