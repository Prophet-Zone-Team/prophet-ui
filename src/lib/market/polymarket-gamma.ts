export const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export interface GammaMarketRecord {
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
  volume24hrClob?: number | string;
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
  sportsMarketType?: string;
  groupItemTitle?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface GammaEventRecord {
  id?: string | number;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  eventDate?: string;
  endDate?: string;
  seriesSlug?: string;
  volume?: number | string;
  volume24hr?: number | string;
  liquidity?: number | string;
  active?: boolean;
  closed?: boolean;
  live?: boolean;
  score?: string;
  period?: string;
  elapsed?: string;
  gameStatus?: string;
  markets?: GammaMarketRecord[];
  tags?: Array<{ id?: string | number; label?: string; slug?: string }>;
  series?: Array<{ id?: string | number; title?: string; slug?: string }>;
}

export interface GammaSportsRecord {
  sport?: string;
  image?: string;
  tags?: string;
  series?: string;
}

export function parseGammaArrayField(
  value: string[] | string | number[] | undefined,
): unknown[] {
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

export function toGammaNumber(value: number | string | undefined | unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function firstGammaNumber(
  ...values: Array<number | string | undefined>
): number | undefined {
  for (const value of values) {
    const parsed = toGammaNumber(value);

    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
}

export function normalizeGammaSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function clampGammaProbability(value: number): number {
  return Math.round(Math.max(0.1, Math.min(99.9, value)) * 10) / 10;
}

export function priceToProbability(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return clampGammaProbability(value <= 1 ? value * 100 : value);
}

export function slugifyTeamName(value: string): string {
  return normalizeGammaSearchText(value).replace(/\s+/g, "-");
}

export function isGammaEventRecord(value: unknown): value is GammaEventRecord {
  return typeof value === "object" && value !== null;
}

export function isGammaMarketRecord(value: unknown): value is GammaMarketRecord {
  return typeof value === "object" && value !== null;
}

export function isGammaSportsRecord(value: unknown): value is GammaSportsRecord {
  return typeof value === "object" && value !== null;
}
