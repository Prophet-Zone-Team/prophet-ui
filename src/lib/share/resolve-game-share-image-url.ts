import type { GameTradeContext } from "@/app/trade/_shared/render-trade-page";
import { resolveMatchSides } from "@/lib/market/schedule-match";

import { resolveShareAssetOrigin } from "./resolve-share-asset-origin";

export const GAME_SHARE_TWITTER_DESCRIPTION =
  "A World Cup prediction market data terminal with user-owned Polymarket order tooling.";

const STATIC_GAME_SHARE_IMAGE_PATH = "/referral/share-card.png";

export async function resolveGameShareImageUrl(
  _context: GameTradeContext,
): Promise<string | null> {
  const origin = resolveShareAssetOrigin();

  if (!origin) {
    return STATIC_GAME_SHARE_IMAGE_PATH;
  }

  return `${origin}${STATIC_GAME_SHARE_IMAGE_PATH}`;
}

export function resolveGameShareTitle(context: GameTradeContext): string {
  const sides = resolveMatchSides(context.match, []);
  return `${sides.home.name} vs ${sides.away.name}`;
}
