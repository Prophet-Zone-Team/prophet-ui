import { mockTeams } from "../mock/teams";
import { getAllTeamFootballMetadata } from "../teams/football-metadata";
import type {
  MarketSentiment,
  Team,
  TeamMarketSnapshot,
} from "../../types/market";
import type { WorldCupMarketData, WorldCupMarketDataProvider } from "./types";

const KALSHI_MARKETS_URL = "https://external-api.kalshi.com/trade-api/v2/markets";
const KALSHI_WORLD_CUP_EVENT_TICKER = "KXMENWORLDCUP-26";
const MIN_WORLD_CUP_MARKETS = 8;

interface KalshiMarketsResponse {
  markets?: KalshiMarket[];
}

interface KalshiMarket {
  ticker?: string;
  event_ticker?: string;
  title?: string;
  status?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price_dollars?: string;
  previous_price_dollars?: string;
  volume_fp?: string;
  volume_24h_fp?: string;
  liquidity_dollars?: string;
  open_interest_fp?: string;
  updated_time?: string;
  created_time?: string;
}

const teamAliases: Record<string, string[]> = {
  usa: ["usa", "us", "united states", "united states of america"],
  "south-korea": ["south korea", "korea republic", "korea"],
  netherlands: ["netherlands", "the netherlands"],
};

export const kalshiDataProvider: WorldCupMarketDataProvider = {
  async getWorldCupMarketData(): Promise<WorldCupMarketData> {
    const markets = await fetchKalshiWorldCupMarkets();
    const snapshots = mapMarketsToTeamSnapshots(markets);

    if (snapshots.length < MIN_WORLD_CUP_MARKETS) {
      throw new Error(`Kalshi returned ${snapshots.length} matching World Cup team markets.`);
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
      footballMetadata: getAllTeamFootballMetadata(),
      meta: {
        source: "kalshi",
        status: "live",
        lastUpdated,
        stale: false,
      },
    };
  },
};

async function fetchKalshiWorldCupMarkets(): Promise<KalshiMarket[]> {
  const url = new URL(KALSHI_MARKETS_URL);
  url.searchParams.set("event_ticker", KALSHI_WORLD_CUP_EVENT_TICKER);
  url.searchParams.set("status", "open");
  url.searchParams.set("limit", "200");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Kalshi Market Data API returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as KalshiMarketsResponse;

  if (!Array.isArray(data.markets)) {
    throw new Error("Kalshi Market Data API returned an unexpected market payload.");
  }

  return data.markets.filter(isKalshiMarket);
}

function mapMarketsToTeamSnapshots(markets: KalshiMarket[]): TeamMarketSnapshot[] {
  const usedTickers = new Set<string>();

  return mockTeams
    .map((team) => {
      const market = findTeamMarket(markets, team, usedTickers);

      if (!market) {
        return undefined;
      }

      const probability = extractYesProbability(market);

      if (probability === undefined) {
        return undefined;
      }

      usedTickers.add(market.ticker ?? `${team.id}-${market.title}`);

      return {
        team,
        market: {
          teamId: team.id,
          probability,
          change24h: getPriceChange(market),
          change7d: 0,
          volume: firstNumber(market.volume_fp, market.volume_24h_fp, market.open_interest_fp) ?? 0,
          sentiment: deriveSentiment(getPriceChange(market)),
          bookmakerImpliedProbability: probability,
          updatedAt: market.updated_time ?? market.created_time ?? new Date().toISOString(),
        },
      };
    })
    .filter(isSnapshot)
    .sort((a, b) => b.market.volume - a.market.volume);
}

function findTeamMarket(
  markets: KalshiMarket[],
  team: Team,
  usedTickers: Set<string>,
): KalshiMarket | undefined {
  const aliases = getTeamAliases(team);

  return markets
    .filter((market) => {
      const ticker = market.ticker ?? `${team.id}-${market.title}`;
      const teamText = normalizeTeamText(`${market.yes_sub_title ?? ""} ${market.no_sub_title ?? ""} ${market.title ?? ""}`);
      const isTeamMarket = aliases.some((alias) => teamText.includes(alias));

      return !usedTickers.has(ticker) && market.event_ticker === KALSHI_WORLD_CUP_EVENT_TICKER && isTeamMarket;
    })
    .sort((a, b) => (firstNumber(b.volume_fp, b.volume_24h_fp) ?? 0) - (firstNumber(a.volume_fp, a.volume_24h_fp) ?? 0))[0];
}

function getTeamAliases(team: Team): string[] {
  const aliases = teamAliases[team.id] ?? [];

  return [team.name, team.code, ...aliases].map(normalizeTeamText).filter(Boolean);
}

function normalizeTeamText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractYesProbability(market: KalshiMarket): number | undefined {
  const bid = firstNumber(market.yes_bid_dollars);
  const ask = firstNumber(market.yes_ask_dollars);
  const last = firstNumber(market.last_price_dollars);
  const price = bid !== undefined && ask !== undefined && ask > 0 ? (bid + ask) / 2 : last;

  if (price === undefined) {
    return undefined;
  }

  return clampProbability(price * 100);
}

function getPriceChange(market: KalshiMarket): number {
  const current = firstNumber(market.last_price_dollars, market.yes_ask_dollars, market.yes_bid_dollars);
  const previous = firstNumber(market.previous_price_dollars);

  if (current === undefined || previous === undefined) {
    return 0;
  }

  return Math.round((current - previous) * 1000) / 10;
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

function toNumber(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
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

function isKalshiMarket(value: unknown): value is KalshiMarket {
  return typeof value === "object" && value !== null;
}

function isSnapshot(value: TeamMarketSnapshot | undefined): value is TeamMarketSnapshot {
  return Boolean(value);
}
