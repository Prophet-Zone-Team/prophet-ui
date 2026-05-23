import type { TradeViewMode } from "@/types/market";

export function teamTradeHref(teamId: string, mode?: TradeViewMode) {
  const base = `/trade/team/${teamId}`;
  return mode === "pro" ? `${base}?mode=pro` : base;
}

export function gameTradeHref(matchId: string, mode?: TradeViewMode) {
  const base = `/trade/game/${matchId}`;
  return mode === "pro" ? `${base}?mode=pro` : base;
}

export function parseTradeViewMode(value: string | string[] | undefined): TradeViewMode {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "pro" ? "pro" : "simple";
}
