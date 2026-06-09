import {
  extractFastBidPolymarketMetadata,
  extractWinnerProbability,
} from "@/lib/market/polymarket-fast-bid-metadata";
import { normalizePriceChange } from "@/lib/market/normalize-price-change";
import {
  firstGammaNumber,
  isGammaEventRecord,
  isGammaMarketRecord,
  type GammaEventRecord,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import type {
  MarketSentiment,
  PolymarketMarketMetadata,
  TeamMarketSnapshot,
} from "@/types/market";

export interface WinnerTeamMarketDynamic {
  probability: number;
  change24h: number;
  change7d: number;
  volume: number;
  sentiment: MarketSentiment;
  bookmakerImpliedProbability: number;
  updatedAt: string;
  polymarket?: PolymarketMarketMetadata;
}

export interface WinnerEventStorePatch {
  eventVolume: number;
  lastUpdated: string;
  byTeamId: Record<string, WinnerTeamMarketDynamic>;
  unmappedTitles: string[];
}

export function mapWinnerEventToStorePatch(event: GammaEventRecord): WinnerEventStorePatch {
  const markets = (event.markets ?? []).filter(isGammaMarketRecord);
  const byTeamId: Record<string, WinnerTeamMarketDynamic> = {};
  const unmappedTitles: string[] = [];

  for (const market of markets) {
    const groupItemTitle = market.groupItemTitle?.trim() ?? "";
    const mapped = mapGammaMarketToWinnerTeamMarketDynamic(market);

    if (!mapped) {
      if (groupItemTitle) {
        unmappedTitles.push(groupItemTitle);
      }

      continue;
    }

    const existing = byTeamId[mapped.team.id];

    if (existing && existing.volume >= mapped.dynamic.volume) {
      continue;
    }

    byTeamId[mapped.team.id] = mapped.dynamic;
  }

  return {
    eventVolume: firstGammaNumber(event.volume, event.volume24hr) ?? 0,
    lastUpdated: new Date().toISOString(),
    byTeamId,
    unmappedTitles,
  };
}

export function parseWinnerGammaEvent(payload: unknown): GammaEventRecord | undefined {
  return isGammaEventRecord(payload) ? payload : undefined;
}

export function isWinnerGammaMarket(value: unknown): value is GammaMarketRecord {
  return isGammaMarketRecord(value);
}

export interface MapGammaMarketToTeamSnapshotOptions {
  expectedSlug?: string;
}

export function mapGammaMarketToTeamSnapshot(
  market: GammaMarketRecord,
  options: MapGammaMarketToTeamSnapshotOptions = {},
): TeamMarketSnapshot | undefined {
  const mapped = mapGammaMarketToWinnerTeamMarketDynamic(market, options);

  if (!mapped) {
    return undefined;
  }

  const { team, dynamic } = mapped;
  const volume24h = firstGammaNumber(market.volume24hr);
  const liquidity = firstGammaNumber(market.liquidity);

  return {
    team,
    market: {
      teamId: team.id,
      probability: dynamic.probability,
      change24h: dynamic.change24h,
      change7d: dynamic.change7d,
      volume: dynamic.volume,
      ...(volume24h !== undefined ? { volume24h } : {}),
      ...(liquidity !== undefined ? { liquidity } : {}),
      sentiment: dynamic.sentiment,
      bookmakerImpliedProbability: dynamic.bookmakerImpliedProbability,
      updatedAt: dynamic.updatedAt,
      polymarket: dynamic.polymarket,
    },
  };
}

export function mergeSnapshotByTeamId(
  snapshots: TeamMarketSnapshot[],
  primary: TeamMarketSnapshot,
): TeamMarketSnapshot[] {
  const byId = new Map(snapshots.map((item) => [item.team.id, item]));
  byId.set(primary.team.id, primary);
  return [...byId.values()];
}

function mapGammaMarketToWinnerTeamMarketDynamic(
  market: GammaMarketRecord,
  options: MapGammaMarketToTeamSnapshotOptions = {},
): { team: NonNullable<ReturnType<typeof resolveWorldCupTeamByGroupItemTitle>>; dynamic: WinnerTeamMarketDynamic } | undefined {
  if (!isGammaMarketRecord(market)) {
    return undefined;
  }

  const groupItemTitle = market.groupItemTitle?.trim() ?? "";

  if (!groupItemTitle) {
    return undefined;
  }

  const team = resolveWorldCupTeamByGroupItemTitle(groupItemTitle);

  if (!team) {
    return undefined;
  }

  const probability = extractWinnerProbability(market);

  if (probability === undefined) {
    return undefined;
  }

  const polymarket = extractFastBidPolymarketMetadata(market);

  if (!polymarket?.tokens?.yes?.tokenId) {
    return undefined;
  }

  if (
    options.expectedSlug &&
    market.slug &&
    market.slug !== options.expectedSlug
  ) {
    return undefined;
  }

  const change24h = normalizePriceChange(
    firstGammaNumber(market.oneDayPriceChange, market.priceChange24h),
  );

  return {
    team,
    dynamic: {
      probability,
      change24h,
      change7d: normalizePriceChange(
        firstGammaNumber(market.oneWeekPriceChange, market.priceChange7d),
      ),
      volume: firstGammaNumber(market.volumeNum, market.volume) ?? 0,
      sentiment: deriveSentiment(change24h),
      bookmakerImpliedProbability: probability,
      updatedAt: market.updatedAt ?? market.createdAt ?? new Date().toISOString(),
      polymarket,
    },
  };
}

function deriveSentiment(change24h: number): MarketSentiment {
  if (change24h >= 1) {
    return "bullish";
  }

  if (change24h <= -1) {
    return "bearish";
  }

  if (Math.abs(change24h) >= 0.4) {
    return "volatile";
  }

  return "neutral";
}
