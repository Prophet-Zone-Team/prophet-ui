import { formatDateTimeFromIso, formatDateTimeFromUnixSeconds } from "@/lib/formatters/datetime";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type {
  PortfolioTimeRange,
  PortfolioTransactionRecord
} from "@/lib/portfolio/types";

type PortfolioPnlPeriodMessageKey =
  | "pnlPeriod1H"
  | "pnlPeriod1D"
  | "pnlPeriod1W"
  | "pnlPeriod1M"
  | "pnlPeriodYTD"
  | "pnlPeriodAll";

const PORTFOLIO_PNL_PERIOD_KEYS: Record<
  PortfolioTimeRange,
  PortfolioPnlPeriodMessageKey
> = {
  "1H": "pnlPeriod1H",
  "1D": "pnlPeriod1D",
  "1W": "pnlPeriod1W",
  "1M": "pnlPeriod1M",
  YTD: "pnlPeriodYTD",
  All: "pnlPeriodAll"
};

export function getPortfolioPnlPeriodLabel(
  t: (key: PortfolioPnlPeriodMessageKey) => string,
  range: PortfolioTimeRange
): string {
  return t(PORTFOLIO_PNL_PERIOD_KEYS[range]);
}

export function formatPortfolioPnlHoverTime(
  timestamp: number | undefined,
  locale: string
): string {
  if (timestamp == null) {
    return "—";
  }

  if (!Number.isFinite(timestamp)) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(timestamp * 1000));
}

export function formatSignedPercent(value?: number): string {
  if (!value) {
    return "0%";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatSignedPortfolioPnl(value: number): string {
  const formatted = formatTeamDetailMoney(Math.abs(value));

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

export function formatShareCardInviteDisplay(
  linkPrefix: string,
  referralCode: string,
  fullLink: string,
): string {
  if (referralCode) {
    return `${linkPrefix.replace(/\?r=$/, "")}?r=${referralCode}`.replace(
      /^https?:\/\//,
      "",
    );
  }

  return fullLink.replace(/^https?:\/\//, "");
}

export function formatPortfolioDateTime(value: string): string {
  return formatDateTimeFromIso(value);
}

export function formatUnixSeconds(value: number): string {
  return formatDateTimeFromUnixSeconds(value);
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
  const marketName = transaction.marketName?.trim() ?? "";

  if (marketName && marketName !== "—") {
    return marketName;
  }

  const teamName = transaction.teamName?.trim() ?? "";

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
