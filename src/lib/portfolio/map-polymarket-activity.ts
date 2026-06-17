import type { PolymarketActivityRow } from "@/lib/portfolio/fetch-polymarket-activity";
import { resolveReportTeamName } from "@/lib/portfolio/teams-condition";
import type {
  PortfolioTransactionRecord,
  PortfolioTransactionType
} from "@/lib/portfolio/types";
import type { UserPositionRecord } from "@/types/market";

function timestampToIso(timestamp: number): string {
  const parsed = new Date(timestamp * 1000);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
}

function endDateToIso(endDate: string | undefined): string {
  if (!endDate?.trim()) {
    return new Date(0).toISOString();
  }

  const parsed = new Date(`${endDate.trim()}T23:59:59.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
}

export function resolveActivityPortfolioType(
  type: string,
  side?: string
): PortfolioTransactionType {
  const normalizedType = type.trim().toUpperCase();
  const normalizedSide = side?.trim().toUpperCase();

  if (normalizedType === "TRADE") {
    if (normalizedSide === "SELL") {
      return "sell";
    }

    return "buy";
  }

  if (normalizedType === "REDEEM") {
    return "redeem";
  }

  if (normalizedType === "DEPOSIT") {
    return "deposit";
  }

  if (normalizedType === "WITHDRAW") {
    return "withdraw";
  }

  if (
    normalizedType === "YIELD" ||
    normalizedType === "REWARD" ||
    normalizedType === "MAKER_REBATE" ||
    normalizedType === "REFERRAL_REWARD"
  ) {
    return "claim";
  }

  if (
    normalizedType === "SPLIT" ||
    normalizedType === "MERGE" ||
    normalizedType === "CONVERSION"
  ) {
    return "activity";
  }

  return "activity";
}

function resolveActivityDisplaySide(row: PolymarketActivityRow): string {
  const outcome = row.outcome?.trim();

  if (outcome) {
    return outcome;
  }

  const side = row.side?.trim();

  if (side) {
    return side;
  }

  return "—";
}

function resolveActivitySlug(row: PolymarketActivityRow): string {
  return row.slug?.trim() || row.eventSlug?.trim() || "";
}

function resolveActivityTeamName(row: PolymarketActivityRow): string {
  return resolveReportTeamName({
    title: row.title,
    outcome: row.outcome
  });
}

export function mapPolymarketActivity(
  row: PolymarketActivityRow
): PortfolioTransactionRecord {
  const type = resolveActivityPortfolioType(row.type, row.side);
  const slug = resolveActivitySlug(row);
  const createdAt = timestampToIso(row.timestamp);

  return {
    id: `${row.transactionHash}:${row.timestamp}:${row.type}:${row.asset ?? row.conditionId ?? ""}`,
    type,
    side: resolveActivityDisplaySide(row),
    price: String(row.price),
    size: row.size > 0 ? row.size : undefined,
    amount: String(row.usdcSize),
    marketName: row.title?.trim() || "—",
    teamName: resolveActivityTeamName(row),
    slug,
    source: "",
    createdAt,
    tradeCreatedAt: createdAt,
    txHash: row.transactionHash
  };
}

export function mapPolymarketActivities(
  rows: PolymarketActivityRow[] | undefined
): PortfolioTransactionRecord[] {
  return (rows ?? []).map((row) => mapPolymarketActivity(row));
}

export function mapLossPositionToTransaction(
  position: UserPositionRecord
): PortfolioTransactionRecord {
  const slug = position.slug?.trim() || position.eventSlug?.trim() || "";
  const createdAt = endDateToIso(position.endDate);

  return {
    id: `loss:${position.conditionId}:${position.asset}`,
    type: "loss",
    side: position.outcome?.trim() || "—",
    price: String(position.avgPrice),
    size: position.size > 0 ? position.size : undefined,
    amount: String(position.initialValue),
    marketName: position.title?.trim() || "—",
    teamName: resolveReportTeamName({
      title: position.title,
      outcome: position.outcome
    }),
    slug,
    source: "",
    createdAt,
    tradeCreatedAt: createdAt,
    txHash: ""
  };
}

export function mapLossPositionsToTransactions(
  positions: UserPositionRecord[] | undefined
): PortfolioTransactionRecord[] {
  return (positions ?? [])
    .filter((position) => position.currentValue === 0)
    .map((position) => mapLossPositionToTransaction(position));
}

export function mergePortfolioHistoryByTime(
  items: PortfolioTransactionRecord[]
): PortfolioTransactionRecord[] {
  return [...items].sort(
    (left, right) =>
      Date.parse(right.tradeCreatedAt) - Date.parse(left.tradeCreatedAt)
  );
}
