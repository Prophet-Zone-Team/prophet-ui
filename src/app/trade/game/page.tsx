import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  loadGameTradeContext,
  renderGameTradePage,
} from "@/app/trade/_shared/render-trade-page";
import {
  GAME_SHARE_TWITTER_DESCRIPTION,
  resolveGameShareImageUrl,
  resolveGameShareTitle,
} from "@/lib/share/resolve-game-share-image-url";
import {
  reportHeadersToWatcher,
  shouldGenerateGameShareImage,
  TWITTER_PREVIEW_PARAM,
} from "@/lib/share/should-generate-game-share-image";
import { getGameShareCardRenderDimensions } from "@/lib/share/render-game-share-card";

interface TradeGameRouteProps {
  searchParams: Promise<{
    slug?: string;
    [TWITTER_PREVIEW_PARAM]?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: TradeGameRouteProps): Promise<Metadata> {
  const params = await searchParams;
  const { slug } = params;

  if (!slug) {
    return {};
  }

  const headersList = await headers();

  await reportHeadersToWatcher(headersList);

  if (
    !shouldGenerateGameShareImage(
      headersList,
      params[TWITTER_PREVIEW_PARAM],
    )
  ) {
    return {};
  }

  try {
    const context = await loadGameTradeContext(slug);
    const imageUrl = await resolveGameShareImageUrl(context);

    if (!imageUrl) {
      return {};
    }

    const title = resolveGameShareTitle(context);
    const renderDimensions = getGameShareCardRenderDimensions();

    return {
      title,
      twitter: {
        card: "summary_large_image",
        site: "@prophet",
        creator: "@prophet",
        title,
        description: GAME_SHARE_TWITTER_DESCRIPTION,
        images: [imageUrl],
      },
      openGraph: {
        title,
        description: GAME_SHARE_TWITTER_DESCRIPTION,
        images: [
          {
            url: imageUrl,
            width: renderDimensions.width,
            height: renderDimensions.height,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating game share image: %o", error);
    return {};
  }
}

export default async function Page({ searchParams }: TradeGameRouteProps) {
  const { slug } = await searchParams;

  if (!slug) {
    notFound();
  }

  return renderGameTradePage(slug);
}
