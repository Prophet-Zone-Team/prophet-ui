import { GAME_SHARE_CARD_DIMENSIONS } from "./game-share-constants";

const DEFAULT_PROPHET_OG_API_URL = "http://localhost:8787";
const REQUEST_TIMEOUT_MS = 15_000;

interface ProphetOgShareResponse {
  code: number;
  message: string;
  data: {
    url: string;
    title: string;
    width: number;
    height: number;
  } | null;
}

export interface GameShareOgMetadata {
  imageUrl: string;
  title: string;
  width: number;
  height: number;
}

function getProphetOgApiUrl(): string {
  const configured = process.env.PROPHET_OG_API_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return DEFAULT_PROPHET_OG_API_URL;
}

function getProphetOgApiKey(): string | undefined {
  return process.env.PROPHET_OG_API_KEY?.trim() || undefined;
}

export async function fetchGameShareOgMetadata(
  slug: string,
): Promise<GameShareOgMetadata | null> {
  const apiKey = getProphetOgApiKey();

  if (!apiKey) {
    console.error("[game-share-og] Missing PROPHET_OG_API_KEY");
    return null;
  }

  const url = new URL(`${getProphetOgApiUrl()}/v1/share/game`);
  url.searchParams.set("slug", slug);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        "[game-share-og] Request failed with status %s",
        response.status,
      );
      return null;
    }

    const payload = (await response.json()) as ProphetOgShareResponse;

    if (payload.code !== 0 || !payload.data?.url) {
      console.error(
        "[game-share-og] Invalid response: %s",
        payload.message || "missing data.url",
      );
      return null;
    }

    return {
      imageUrl: payload.data.url,
      title: payload.data.title,
      width: payload.data.width || GAME_SHARE_CARD_DIMENSIONS.width,
      height: payload.data.height || GAME_SHARE_CARD_DIMENSIONS.height,
    };
  } catch (error) {
    console.error("[game-share-og] Failed to fetch share metadata", error);
    return null;
  }
}
