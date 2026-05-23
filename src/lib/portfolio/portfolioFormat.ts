import { formatTeamDetailMoney } from "../team/detailFormat";

export function formatPortfolioMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2
  }).format(value);
}

export function formatSignedPortfolioMoney(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPortfolioMoney(value)}`;
}

export function formatSignedPercent(value: number): string {
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(price);
}

export function formatPnlSubline(cashPnl: number, percentPnl: number): string {
  const sign = cashPnl > 0 ? "+" : "";
  return `${sign}${formatTeamDetailMoney(cashPnl)} (${sign}${percentPnl.toFixed(2)}%)`;
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
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
