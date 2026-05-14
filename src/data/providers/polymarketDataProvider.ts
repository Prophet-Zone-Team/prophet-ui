import { mockTeams } from "../mock/teams";
import type {
  MarketSentiment,
  PolymarketFeeDetails,
  PolymarketMarketMetadata,
  Team,
  TeamMarketSnapshot,
} from "../../types/market";
import type { WorldCupMarketData, WorldCupMarketDataProvider } from "./types";

const GAMMA_MARKETS_URL = "https://gamma-api.polymarket.com/markets";
const CLOB_MARKET_URL = "https://clob.polymarket.com/clob-markets";
const CLOB_MARKET_BY_TOKEN_URL = "https://clob.polymarket.com/markets-by-token";
const MIN_WORLD_CUP_MARKETS = 8;

interface GammaMarket {
  id?: string;
  slug?: string;
  question?: string;
  title?: string;
  description?: string;
  outcomes?: string[] | string;
  outcomePrices?: number[] | string;
  clobTokenIds?: string[] | string;
  lastTradePrice?: number | string;
  volume?: number | string;
  volumeNum?: number | string;
  volume24hr?: number | string;
  liquidity?: number | string;
  conditionId?: string;
  orderPriceMinTickSize?: number | string;
  orderMinSize?: number | string;
  acceptingOrders?: boolean;
  negRisk?: boolean;
  oneDayPriceChange?: number | string;
  oneWeekPriceChange?: number | string;
  priceChange24h?: number | string;
  priceChange7d?: number | string;
  updatedAt?: string;
  createdAt?: string;
}

interface ClobMarketDetails {
  c?: string;
  fd?: {
    r?: number;
    e?: number;
    to?: boolean;
  };
  mbf?: number;
  tbf?: number;
}

export const polymarketDataProvider: WorldCupMarketDataProvider = {
  async getWorldCupMarketData(): Promise<WorldCupMarketData> {
    const markets = await fetchWorldCupMarkets();
    const snapshots = await mapMarketsToTeamSnapshots(markets);

    if (snapshots.length < MIN_WORLD_CUP_MARKETS) {
      throw new Error(`Polymarket returned ${snapshots.length} matching World Cup team markets.`);
    }

    const lastUpdated = snapshots.reduce((latest, snapshot) => {
      return snapshot.market.updatedAt > latest ? snapshot.market.updatedAt : latest;
    }, snapshots[0]?.market.updatedAt ?? new Date().toISOString());

    return {
      snapshots,
      newsEvents: [],
      probabilityHistory: [],
      footballContext: [],
      footballTeamContext: [],
      meta: {
        source: "polymarket",
        status: "live",
        lastUpdated,
        stale: false,
      },
    };
  },
};

async function fetchWorldCupMarkets(): Promise<GammaMarket[]> {
  const url = new URL(GAMMA_MARKETS_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", "200");
  url.searchParams.set("order", "volume_24hr");
  url.searchParams.set("ascending", "false");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Polymarket Gamma API returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("Polymarket Gamma API returned an unexpected market payload.");
  }

  return data.filter(isGammaMarket);
}

async function mapMarketsToTeamSnapshots(markets: GammaMarket[]): Promise<TeamMarketSnapshot[]> {
  const usedMarketIds = new Set<string>();
  const selectedMarkets: Array<{
    team: Team;
    market: GammaMarket;
    probability: number;
    polymarket?: PolymarketMarketMetadata;
  }> = [];

  for (const team of mockTeams) {
    const market = findBestTeamMarket(markets, team, usedMarketIds);

    if (!market) {
      continue;
    }

    const probability = extractYesProbability(market);
    const polymarket = extractPolymarketMetadata(market);

    if (probability === undefined) {
      continue;
    }

    usedMarketIds.add(market.id ?? market.slug ?? `${team.id}-${market.question}`);
    selectedMarkets.push({ team, market, probability, polymarket });
  }

  const feeDetails = await fetchClobFeeDetails(selectedMarkets);

  return selectedMarkets
    .map(({ team, market, probability, polymarket }) => ({
      team,
      market: {
        teamId: team.id,
        probability,
        change24h: normalizePriceChange(firstNumber(market.oneDayPriceChange, market.priceChange24h)),
        change7d: normalizePriceChange(firstNumber(market.oneWeekPriceChange, market.priceChange7d)),
        volume: firstNumber(market.volume24hr, market.volumeNum, market.volume, market.liquidity) ?? 0,
        sentiment: deriveSentiment(normalizePriceChange(firstNumber(market.oneDayPriceChange, market.priceChange24h))),
        bookmakerImpliedProbability: probability,
        updatedAt: market.updatedAt ?? market.createdAt ?? new Date().toISOString(),
        polymarket: attachClobFeeDetails(polymarket, feeDetails.get(getMarketFeeKey(market))),
      },
    }))
    .sort((a, b) => b.market.volume - a.market.volume);
}

function findBestTeamMarket(
  markets: GammaMarket[],
  team: Team,
  usedMarketIds: Set<string>,
): GammaMarket | undefined {
  const teamName = team.name.toLowerCase();
  const teamCode = team.code.toLowerCase();

  return markets
    .filter((market) => {
      const id = market.id ?? market.slug ?? `${team.id}-${market.question}`;
      const text = `${market.question ?? ""} ${market.title ?? ""} ${market.description ?? ""} ${market.slug ?? ""}`.toLowerCase();
      const isWorldCup = text.includes("world cup") || text.includes("fifa");
      const isTeamMarket = text.includes(teamName) || text.includes(` ${teamCode} `);

      return !usedMarketIds.has(id) && isWorldCup && isTeamMarket;
    })
    .sort((a, b) => (firstNumber(b.volume24hr, b.volumeNum, b.volume) ?? 0) - (firstNumber(a.volume24hr, a.volumeNum, a.volume) ?? 0))[0];
}

function extractPolymarketMetadata(market: GammaMarket): PolymarketMarketMetadata | undefined {
  const clobTokenIds = parseArrayField(market.clobTokenIds).map(String);
  const outcomes = parseArrayField(market.outcomes).map(String);
  const outcomePrices = parseArrayField(market.outcomePrices);
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const noIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "no");
  const yesTokenId = clobTokenIds[yesIndex >= 0 ? yesIndex : 0];
  const noTokenId = clobTokenIds[noIndex >= 0 ? noIndex : 1];

  if (!yesTokenId && !noTokenId) {
    return undefined;
  }

  return {
    marketId: market.id,
    conditionId: market.conditionId,
    question: market.question,
    slug: market.slug,
    acceptingOrders: market.acceptingOrders === true,
    negRisk: market.negRisk === true,
    tickSize: normalizeTickSize(market.orderPriceMinTickSize),
    minOrderSize: firstNumber(market.orderMinSize),
    tokens: {
      yes: yesTokenId
        ? {
            tokenId: yesTokenId,
            outcome: outcomes[yesIndex >= 0 ? yesIndex : 0] ?? "Yes",
            price: toNumber(outcomePrices[yesIndex >= 0 ? yesIndex : 0]),
          }
        : undefined,
      no: noTokenId
        ? {
            tokenId: noTokenId,
            outcome: outcomes[noIndex >= 0 ? noIndex : 1] ?? "No",
            price: toNumber(outcomePrices[noIndex >= 0 ? noIndex : 1]),
          }
        : undefined,
    },
  };
}

async function fetchClobFeeDetails(
  markets: Array<{ market: GammaMarket }>,
): Promise<Map<string, PolymarketFeeDetails>> {
  const marketRefs = [
    ...new Map(
      markets
        .map(({ market }) => ({ key: getMarketFeeKey(market), conditionId: market.conditionId, tokenId: getFirstClobTokenId(market) }))
        .filter((item) => item.conditionId || item.tokenId)
        .map((item) => [item.key, item]),
    ).values(),
  ];
  const entries = await Promise.all(
    marketRefs.map(async ({ key, conditionId, tokenId }) => {
      try {
        const resolvedConditionId = conditionId ?? (tokenId ? await fetchConditionIdByToken(tokenId) : undefined);

        if (!resolvedConditionId) {
          return undefined;
        }

        const response = await fetch(`${CLOB_MARKET_URL}/${resolvedConditionId}`, {
          cache: "no-store",
          headers: {
            accept: "application/json",
          },
        });

        if (!response.ok) {
          return undefined;
        }

        const payload = (await response.json()) as ClobMarketDetails;

        return [key, toPolymarketFeeDetails(payload)] as const;
      } catch {
        return undefined;
      }
    }),
  );
  const feesByConditionId = new Map<string, PolymarketFeeDetails>();

  for (const entry of entries) {
    if (entry?.[1]) {
      feesByConditionId.set(entry[0], entry[1]);
    }
  }

  return feesByConditionId;
}

async function fetchConditionIdByToken(tokenId: string): Promise<string | undefined> {
  const response = await fetch(`${CLOB_MARKET_BY_TOKEN_URL}/${encodeURIComponent(tokenId)}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as { condition_id?: unknown; c?: unknown };
  const conditionId = typeof payload.condition_id === "string" ? payload.condition_id : payload.c;

  return typeof conditionId === "string" && /^0x[a-fA-F0-9]{64}$/.test(conditionId) ? conditionId : undefined;
}

function getMarketFeeKey(market: GammaMarket): string {
  return market.conditionId ?? getFirstClobTokenId(market) ?? market.id ?? market.slug ?? "";
}

function getFirstClobTokenId(market: GammaMarket): string | undefined {
  return parseArrayField(market.clobTokenIds).map(String).find(Boolean);
}

function attachClobFeeDetails(
  metadata: PolymarketMarketMetadata | undefined,
  fee: PolymarketFeeDetails | undefined,
): PolymarketMarketMetadata | undefined {
  if (!metadata || !fee) {
    return metadata;
  }

  return {
    ...metadata,
    fee,
  };
}

function toPolymarketFeeDetails(payload: ClobMarketDetails): PolymarketFeeDetails | undefined {
  const rate = toNumber(payload.fd?.r);
  const exponent = toNumber(payload.fd?.e);

  if (rate === undefined || exponent === undefined) {
    return undefined;
  }

  return {
    rate,
    exponent,
    takerOnly: payload.fd?.to === true,
    makerBaseFee: toNumber(payload.mbf),
    takerBaseFee: toNumber(payload.tbf),
  };
}

function normalizeTickSize(value: number | string | undefined): PolymarketMarketMetadata["tickSize"] {
  const parsed = toNumber(value);

  if (parsed === 0.1) {
    return "0.1";
  }

  if (parsed === 0.001) {
    return "0.001";
  }

  if (parsed === 0.0001) {
    return "0.0001";
  }

  return "0.01";
}

function extractYesProbability(market: GammaMarket): number | undefined {
  const outcomePrices = parseArrayField(market.outcomePrices);
  const outcomes = parseArrayField(market.outcomes).map(String);
  const yesIndex = Math.max(0, outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes"));
  const yesPrice = toNumber(outcomePrices[yesIndex]) ?? toNumber(market.lastTradePrice);

  if (yesPrice === undefined) {
    return undefined;
  }

  return clampProbability(yesPrice <= 1 ? yesPrice * 100 : yesPrice);
}

function parseArrayField(value: GammaMarket["outcomePrices"] | GammaMarket["outcomes"]): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function firstNumber(...values: Array<number | string | undefined>): number | undefined {
  for (const value of values) {
    const parsed = toNumber(value);

    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
}

function toNumber(value: number | string | undefined | unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizePriceChange(value: number | undefined): number {
  if (value === undefined) {
    return 0;
  }

  return Math.round((Math.abs(value) <= 1 ? value * 100 : value) * 10) / 10;
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

function clampProbability(value: number): number {
  return Math.round(Math.max(0.1, Math.min(99.9, value)) * 10) / 10;
}

function isGammaMarket(value: unknown): value is GammaMarket {
  return typeof value === "object" && value !== null;
}

function isSnapshot(value: unknown): value is TeamMarketSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "team" in value &&
    "market" in value
  );
}
