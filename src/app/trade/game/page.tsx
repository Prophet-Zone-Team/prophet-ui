import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { renderGameTradePage } from "@/app/trade/_shared/render-trade-page";
import { fetchGameShareOgMetadata } from "@/lib/share/fetch-game-share-og";
import { GAME_SHARE_TWITTER_DESCRIPTION } from "@/lib/share/game-share-constants";
import {
  shouldGenerateGameShareImage,
  TWITTER_PREVIEW_PARAM,
} from "@/lib/share/should-generate-game-share-image";

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

  if (
    !shouldGenerateGameShareImage(
      headersList,
      params[TWITTER_PREVIEW_PARAM],
    )
  ) {
    return {};
  }

  try {
    const shareMetadata = await fetchGameShareOgMetadata(slug);

    if (!shareMetadata) {
      return {
        twitter: {
          description: "Failed to generate game share image",
        },
      };
    }

    const { imageUrl, title, width, height } = shareMetadata;

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
            width,
            height,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating game share image: %o", error);
    return {
      twitter: {
        description: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export default async function Page({ searchParams }: TradeGameRouteProps) {
  const { slug } = await searchParams;

  if (!slug) {
    notFound();
  }

  return renderGameTradePage(slug);
}
