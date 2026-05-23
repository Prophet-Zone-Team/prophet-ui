import type { TradeViewMode } from "@/types/market";

export function tradeHref(slug: string, mode?: TradeViewMode) {
  const base = `/trade/${slug}`;
  return mode === "pro" ? `${base}/pro` : base;
}

export function teamTradeHref(teamId: string, mode?: TradeViewMode) {
  return tradeHref(teamId, mode);
}

export function gameTradeHref(matchId: string, mode?: TradeViewMode) {
  return tradeHref(matchId, mode);
}

export function parseTradeViewMode(value: string | string[] | undefined): TradeViewMode {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "pro" ? "pro" : "simple";
}
