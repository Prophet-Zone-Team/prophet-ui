import type {
  PortfolioTransactionRecord,
  PortfolioTransactionType
} from "@/lib/portfolio/types";
import type { ProphetUserTransaction } from "@/types/prophet-api";

const LEGACY_TRANSACTION_TYPES = new Set<PortfolioTransactionType>([
  "buy",
  "sell",
  "redeem",
  "deposit",
  "withdraw",
  "claim"
]);

const FUNDING_TRANSACTION_TYPES = new Set<PortfolioTransactionType>([
  "deposit",
  "withdraw",
  "redeem",
  "claim"
]);

function parseCreatedAt(value: string | undefined): string {
  if (!value?.trim()) {
    return new Date(0).toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

function parseShares(value: string | undefined): number | undefined {
  const parsed = Number(value?.trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function resolvePortfolioTransactionType(
  row: ProphetUserTransaction
): PortfolioTransactionType {
  const apiType = row.type?.trim().toLowerCase();

  if (
    apiType &&
    LEGACY_TRANSACTION_TYPES.has(apiType as PortfolioTransactionType)
  ) {
    return apiType as PortfolioTransactionType;
  }

  if (apiType === "deposit") {
    return "deposit";
  }

  if (apiType === "withdraw") {
    return "withdraw";
  }

  if (apiType === "redeem") {
    return "redeem";
  }

  if (apiType === "trade" || apiType === "order") {
    const tradeSide = row.trade_side?.trim().toLowerCase();

    if (tradeSide === "buy" || tradeSide === "sell") {
      return tradeSide;
    }
  }

  return "buy";
}

function resolveTransactionAmount(
  row: ProphetUserTransaction,
  type: PortfolioTransactionType,
  shares: number | undefined
): string {
  if (type === "sell" || type === "redeem") {
    const price = Number(row.price || "0");
    const shareCount = shares ?? parseShares(row.amount) ?? 0;

    if (price > 0 && shareCount > 0) {
      return String(price * shareCount);
    }
  }

  return row.amount?.trim() || "—";
}

export function mapProphetUserTransaction(
  row: ProphetUserTransaction,
  index = 0
): PortfolioTransactionRecord {
  const type = resolvePortfolioTransactionType(row);
  const size = parseShares(row.size);
  const tradeCreatedAt = parseCreatedAt(row.trade_create_at ?? row.created_at);
  const createdAt = parseCreatedAt(row.created_at);

  return {
    id: String(
      row.id ?? row.tx_hash ?? `${tradeCreatedAt}-${row.market_name ?? index}`
    ),
    type,
    side: row.side?.trim() || "—",
    price: row.price?.trim() || "0",
    size,
    amount: resolveTransactionAmount(row, type, size),
    marketName: row.market_name?.trim() || "—",
    teamName: row.team_name?.trim() || "",
    slug: row.slug?.trim() || "",
    source: row.source?.trim() || "",
    createdAt,
    tradeCreatedAt,
    txHash: row.tx_hash?.trim() || ""
  };
}

export function mapProphetUserTransactions(
  rows: ProphetUserTransaction[] | undefined
): PortfolioTransactionRecord[] {
  return (rows ?? []).map((row, index) =>
    mapProphetUserTransaction(row, index)
  );
}

export function isFundingPortfolioTransactionType(
  type: PortfolioTransactionType
): boolean {
  return FUNDING_TRANSACTION_TYPES.has(type);
}
