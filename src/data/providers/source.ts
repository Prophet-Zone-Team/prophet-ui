import type { MarketDataSource } from "./types";

export const MARKET_DATA_SOURCES: MarketDataSource[] = ["composite", "polymarket", "kalshi", "mock"];

export const DEFAULT_MARKET_DATA_SOURCE: MarketDataSource = "polymarket";

export const ENABLED_MARKET_DATA_SOURCES: MarketDataSource[] = [DEFAULT_MARKET_DATA_SOURCE];

export const VISIBLE_MARKET_DATA_SOURCES: MarketDataSource[] = ENABLED_MARKET_DATA_SOURCES;

export function isEnabledMarketDataSource(value: string | undefined): value is MarketDataSource {
  return Boolean(value && ENABLED_MARKET_DATA_SOURCES.includes(value as MarketDataSource));
}

export function normalizeMarketDataSource(value: MarketDataSource | string | undefined): MarketDataSource {
  if (value === "mock") {
    return "mock";
  }

  return isEnabledMarketDataSource(value) ? value : DEFAULT_MARKET_DATA_SOURCE;
}

export function parseMarketDataSource(value: string | string[] | undefined): MarketDataSource {
  const source = Array.isArray(value) ? value[0] : value;
  return isEnabledMarketDataSource(source) ? source : DEFAULT_MARKET_DATA_SOURCE;
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
