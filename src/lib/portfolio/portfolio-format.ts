import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { PortfolioTransactionRecord } from "@/lib/portfolio/types";

export function formatSignedPercent(value?: number): string {
  if (!value) {
    return "0%";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatPortfolioDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(date)
    .replace(",", "");
}

export function formatUnixSeconds(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return formatPortfolioDateTime(new Date(value * 1000).toISOString());
}

export function formatSharePrice(price: number): string {
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(price * 100) + "￠"
  );
}

export function formatPnlSubline(cashPnl: number, percentPnl: number): string {
  const sign = cashPnl > 0 ? "+" : "";
  return `${sign}${formatTeamDetailMoney(cashPnl)} (${sign}${percentPnl.toFixed(2)}%)`;
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatTransactionPrice(price: string): string {
  const numeric = Number(price);

  if (!Number.isFinite(numeric)) {
    return price.startsWith("$") ? price : `$${price}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(numeric);
}

export function formatPortfolioTransactionMarketName(
  transaction: Pick<
    PortfolioTransactionRecord,
    "marketName" | "teamName" | "source"
  >
): string {
  const marketName = transaction.marketName.trim();

  if (marketName && marketName !== "—") {
    return marketName;
  }

  const teamName = transaction.teamName.trim();

  if (transaction.source === "strategy" && teamName) {
    return `Will ${teamName} win the 2026 FIFA World Cup?`;
  }

  return marketName || "—";
}

export function getOutcomeToneClass(outcome: string): string {
  const normalized = outcome.toLowerCase();

  if (normalized === "no") {
    return "text-prophet-red";
  }

  if (normalized === "yes" || normalized === "draw") {
    return "text-prophet-green";
  }

  return "text-prophet-muted";
}
