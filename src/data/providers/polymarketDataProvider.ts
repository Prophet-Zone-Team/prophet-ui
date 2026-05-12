import { mockTeams } from "../mock/teams";
import type {
  MarketSentiment,
  Team,
  TeamMarketSnapshot,
} from "../../types/market";
import type { WorldCupMarketData, WorldCupMarketDataProvider } from "./types";

const GAMMA_MARKETS_URL = "https://gamma-api.polymarket.com/markets";
const MIN_WORLD_CUP_MARKETS = 8;

interface GammaMarket {
  id?: string;
  slug?: string;
  question?: string;
  title?: string;
  description?: string;
  outcomes?: string[] | string;
  outcomePrices?: number[] | string;
  lastTradePrice?: number | string;
  volume?: number | string;
  volumeNum?: number | string;
  volume24hr?: number | string;
  liquidity?: number | string;
  oneDayPriceChange?: number | string;
  oneWeekPriceChange?: number | string;
  priceChange24h?: number | string;
  priceChange7d?: number | string;
  updatedAt?: string;
  createdAt?: string;
}

export const polymarketDataProvider: WorldCupMarketDataProvider = {
  async getWorldCupMarketData(): Promise<WorldCupMarketData> {
    const markets = await fetchWorldCupMarkets();
    const snapshots = mapMarketsToTeamSnapshots(markets);

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

function mapMarketsToTeamSnapshots(markets: GammaMarket[]): TeamMarketSnapshot[] {
  const usedMarketIds = new Set<string>();

  return mockTeams
    .map((team) => {
      const market = findBestTeamMarket(markets, team, usedMarketIds);

      if (!market) {
        return undefined;
      }

      const probability = extractYesProbability(market);

      if (probability === undefined) {
        return undefined;
      }

      usedMarketIds.add(market.id ?? market.slug ?? `${team.id}-${market.question}`);

      return {
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
        },
      };
    })
    .filter(isSnapshot)
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

function isSnapshot(value: TeamMarketSnapshot | undefined): value is TeamMarketSnapshot {
  return Boolean(value);
}
