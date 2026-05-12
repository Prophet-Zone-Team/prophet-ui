import type { MarketDataSource } from "./types";

export const MARKET_DATA_SOURCES: MarketDataSource[] = ["composite", "polymarket", "kalshi", "mock"];

export const VISIBLE_MARKET_DATA_SOURCES: MarketDataSource[] = ["composite", "polymarket", "kalshi"];

export function parseMarketDataSource(value: string | string[] | undefined): MarketDataSource {
  const source = Array.isArray(value) ? value[0] : value;

  if (source && MARKET_DATA_SOURCES.includes(source as MarketDataSource)) {
    return source as MarketDataSource;
  }

  return "composite";
}

export function getMarketDataSourceLabel(source: MarketDataSource): string {
  switch (source) {
    case "composite":
      return "Composite";
    case "polymarket":
      return "Polymarket";
    case "kalshi":
      return "Kalshi";
    case "mock":
      return "Mock";
  }
}
