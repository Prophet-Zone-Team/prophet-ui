import type {
  PortfolioTransactionRecord,
  PortfolioTransactionType
} from "@/lib/portfolio/types";
import type { ProphetUserTransaction } from "@/types/prophet-api";

const TRANSACTION_TYPES = new Set<PortfolioTransactionType>([
  "buy",
  "sell",
  "redeem",
  "deposit",
  "withdraw",
  "claim"
]);

function normalizeTransactionType(
  value: string | undefined
): PortfolioTransactionType {
  const normalized = value?.toLowerCase();

  if (
    normalized &&
    TRANSACTION_TYPES.has(normalized as PortfolioTransactionType)
  ) {
    return normalized as PortfolioTransactionType;
  }

  return "buy";
}

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

export function mapProphetUserTransaction(
  row: ProphetUserTransaction,
  index = 0
): PortfolioTransactionRecord {
  let amount = row.amount?.trim() || "—";
  if (row.type === "sell" || row.type === "redeem") {
    amount = (Number(row.price || "0") * Number(row.amount || "0")).toString();
  }
  return {
    id: String(
      row.id ??
        row.tx_hash ??
        `${row.created_at ?? "unknown"}-${row.market_name ?? index}`
    ),
    type: normalizeTransactionType(row.type),
    side: row.side?.trim() || "—",
    price: row.price?.trim() || "0",
    amount: amount,
    marketName: row.market_name?.trim() || "—",
    teamName: row.team_name?.trim() || "",
    slug: row.slug?.trim() || "",
    source: row.source?.trim() || "",
    createdAt: parseCreatedAt(row.created_at),
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
