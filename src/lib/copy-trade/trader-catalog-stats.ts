import type { TraderCatalogEntry } from "@/types/copy-trade-api";

export type CopyTradeRankWalletType = "all" | "whale" | "smart";
export type TraderTag = "smart" | "whale";
export type TraderRiskTone = "low" | "mid" | "high" | "neutral";

export function isUserImportedTrader(trader: TraderCatalogEntry): boolean {
  return trader.Source === "user_imported";
}

export function findCatalogTraderByWallet(
  traders: TraderCatalogEntry[],
  wallet: string
): TraderCatalogEntry | undefined {
  const normalized = wallet.trim().toLowerCase();

  return traders.find(
    (trader) =>
      trader.Wallet.toLowerCase() === normalized && !isUserImportedTrader(trader)
  );
}

export function traderTag(trader: TraderCatalogEntry): TraderTag | "" {
  const tag = String(trader.Tag || "").toLowerCase();
  if (tag === "") {
    return isUserImportedTrader(trader) ? "" : "smart";
  }

  return tag === "smart" || tag === "whale" ? tag : "";
}

export function traderTagLabel(tag: string): string {
  if (tag === "whale") {
    return "Whale";
  }

  if (tag === "smart") {
    return "Smart";
  }

  return "";
}

export function matchesTraderTagFilter(
  trader: TraderCatalogEntry,
  walletType: CopyTradeRankWalletType
): boolean {
  if (walletType === "all") {
    return true;
  }

  if (isUserImportedTrader(trader)) {
    return false;
  }

  return traderTag(trader) === walletType;
}

export function traderRowKey(trader: TraderCatalogEntry): string {
  const source = trader.Source || "catalog";
  const id = trader.ID ?? 0;
  return `${source}:${id}:${trader.Wallet.toLowerCase()}`;
}

export function traderTotalWinRate(trader: TraderCatalogEntry): number {
  return Number(trader.TotalWinRate ?? trader.WinRate30d ?? 0);
}

export function traderTotalPnL(trader: TraderCatalogEntry): number {
  return Number(trader.TotalPnL ?? trader.PnL30d ?? 0);
}

export function traderTotalVolume(trader: TraderCatalogEntry): number {
  return Number(trader.TotalVolume ?? trader.Volume30d ?? 0);
}

export function traderTotalTrades(trader: TraderCatalogEntry): number {
  return Number(trader.TotalTrades ?? trader.Trades30d ?? 0);
}

export function traderPnL24h(trader: TraderCatalogEntry): number {
  return Number(trader.FifaPnL24h ?? trader.PnL24h ?? 0);
}

export function traderPnL7d(trader: TraderCatalogEntry): number | null {
  if (trader.FifaPnL7d == null || !Number.isFinite(trader.FifaPnL7d)) {
    return null;
  }

  return trader.FifaPnL7d;
}

export function resolveRiskTone(level: string): TraderRiskTone {
  const normalized = (level || "").toLowerCase();

  if (normalized.includes("low") || normalized.includes("低")) {
    return "low";
  }

  if (normalized.includes("high") || normalized.includes("高")) {
    return "high";
  }

  if (normalized.includes("mid") || normalized.includes("中")) {
    return "mid";
  }

  return "neutral";
}

export function riskToneClassName(tone: TraderRiskTone): string {
  switch (tone) {
    case "low":
      return "text-[#65AF14]";
    case "mid":
      return "text-[#F7B900]";
    case "high":
      return "text-[#FF674B]";
    default:
      return "text-[#909090]";
  }
}
