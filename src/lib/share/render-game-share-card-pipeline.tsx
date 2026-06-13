import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { initWasm, Resvg } from "@resvg/resvg-wasm";
import React from "react";
import satori from "satori";

import {
  buildGameShareCardData,
  type GameShareCardData,
} from "./build-game-share-card-data";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { GameMarketSnapshot, WorldCupMatch } from "@/types/market";

import { resolveTeamFlagImageCandidates } from "./resolve-team-flag-image-candidates";

import {
  GAME_SHARE_CARD_RENDER_SCALE,
  GameShareCard,
  getGameShareCardRenderDimensions,
} from "./render-game-share-card";

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 300 | 400 | 500 | 600;
  style: "normal";
};

const FONT_FILES: Array<{ file: string; weight: SatoriFont["weight"] }> = [
  { file: "Sora-Light.ttf", weight: 300 },
  { file: "Sora-Regular.ttf", weight: 400 },
  { file: "Sora-Medium.ttf", weight: 500 },
  { file: "Sora-SemiBold.ttf", weight: 600 },
];

let resvgReady: Promise<void> | null = null;
let fontsPromise: Promise<SatoriFont[]> | null = null;

async function ensureResvgReady(): Promise<void> {
  if (!resvgReady) {
    resvgReady = (async () => {
      const wasmPath = join(
        process.cwd(),
        "node_modules/@resvg/resvg-wasm/index_bg.wasm",
      );
      const wasmBuffer = await readFile(wasmPath);
      await initWasm(wasmBuffer);
    })();
  }

  await resvgReady;
}

async function loadFontsFromDisk(): Promise<SatoriFont[]> {
  const fontsDir = join(process.cwd(), "public/fonts");

  return Promise.all(
    FONT_FILES.map(async ({ file, weight }) => {
      const fileBuffer = await readFile(join(fontsDir, file));

      return {
        name: "Sora",
        data: fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength,
        ),
        weight,
        style: "normal" as const,
      };
    }),
  );
}

async function loadFontsFromOrigin(origin: string): Promise<SatoriFont[]> {
  return Promise.all(
    FONT_FILES.map(async ({ file, weight }) => {
      const response = await fetch(`${origin}/fonts/${file}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch font ${file}`);
      }

      return {
        name: "Sora",
        data: await response.arrayBuffer(),
        weight,
        style: "normal" as const,
      };
    }),
  );
}

async function loadSatoriFonts(origin?: string): Promise<SatoriFont[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      try {
        return await loadFontsFromDisk();
      } catch {
        if (!origin) {
          throw new Error("Unable to load Sora fonts for share card rendering");
        }

        return loadFontsFromOrigin(origin);
      }
    })();
  }

  return fontsPromise;
}

export async function fetchImageAsDataUrl(
  url: string | undefined,
): Promise<string | undefined> {
  if (!url) {
    return undefined;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "image/*",
        "User-Agent": "ProphetShareCard/1.0",
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ??
      "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());

    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function fetchFirstImageAsDataUrl(
  urls: string[],
): Promise<string | undefined> {
  for (const url of urls) {
    const dataUrl = await fetchImageAsDataUrl(url);

    if (dataUrl) {
      return dataUrl;
    }
  }

  return undefined;
}

export async function loadProphetLogoDataUrl(origin?: string): Promise<string> {
  const localPath = join(process.cwd(), "public/referral/prophet-logo.png");

  try {
    const buffer = await readFile(localPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    if (!origin) {
      throw new Error("Unable to load prophet logo for share card rendering");
    }

    const response = await fetch(`${origin}/referral/prophet-logo.png`);

    if (!response.ok) {
      throw new Error("Unable to fetch prophet logo for share card rendering");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }
}

export async function prepareGameShareCardData(
  match: WorldCupMatch,
  gameSnapshot: GameMarketSnapshot,
  origin?: string,
): Promise<GameShareCardData> {
  const sides = resolveMatchSides(match, []);

  const [prophetLogoDataUrl, homeLogoDataUrl, awayLogoDataUrl] =
    await Promise.all([
      loadProphetLogoDataUrl(origin),
      fetchFirstImageAsDataUrl(
        resolveTeamFlagImageCandidates(sides.home, match.homeTeamId),
      ),
      fetchFirstImageAsDataUrl(
        resolveTeamFlagImageCandidates(sides.away, match.awayTeamId),
      ),
    ]);

  return buildGameShareCardData(match, gameSnapshot, {
    prophetLogoDataUrl,
    homeLogoDataUrl,
    awayLogoDataUrl,
  });
}

export async function renderGameShareCardPng(
  data: GameShareCardData,
  origin?: string,
): Promise<Buffer> {
  await ensureResvgReady();
  const fonts = await loadSatoriFonts(origin);
  const { width, height } = getGameShareCardRenderDimensions();

  const svg = await satori(
    <GameShareCard data={data} scale={GAME_SHARE_CARD_RENDER_SCALE} />,
    {
      width,
      height,
      fonts,
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: width,
    },
  });

  return Buffer.from(resvg.render().asPng());
}
