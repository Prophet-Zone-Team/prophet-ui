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

function isActivityTradeBuy(row: PolymarketActivityRow): boolean {
  return (
    row.type.trim().toUpperCase() === "TRADE" &&
    row.side?.trim().toUpperCase() === "BUY"
  );
}

export function normalizeLossMatchKey(
  conditionId: string,
  asset: string
): string {
  return `${conditionId.trim().toLowerCase()}:${asset.trim().toLowerCase()}`;
}

export function buildPendingLossMap(
  positions: UserPositionRecord[] | undefined,
  insertedLossIds: Set<string>
): Map<string, PortfolioTransactionRecord[]> {
  const map = new Map<string, PortfolioTransactionRecord[]>();

  for (const position of positions ?? []) {
    if (position.currentValue !== 0) {
      continue;
    }

    const loss = mapLossPositionToTransaction(position);

    if (insertedLossIds.has(loss.id)) {
      continue;
    }

    const key = normalizeLossMatchKey(position.conditionId, position.asset);
    const pending = map.get(key) ?? [];
    pending.push(loss);
    map.set(key, pending);
  }

  return map;
}

export function mapActivityBatchWithLossInsertions(
  rows: PolymarketActivityRow[] | undefined,
  lossPositions: UserPositionRecord[] | undefined,
  insertedLossIds: Set<string>
): PortfolioTransactionRecord[] {
  const pendingLossMap = buildPendingLossMap(lossPositions, insertedLossIds);
  const result: PortfolioTransactionRecord[] = [];

  for (const row of rows ?? []) {
    if (
      isActivityTradeBuy(row) &&
      row.conditionId?.trim() &&
      row.asset?.trim()
    ) {
      const key = normalizeLossMatchKey(row.conditionId, row.asset);
      const pendingLosses = pendingLossMap.get(key) ?? [];

      for (const loss of pendingLosses) {
        if (!insertedLossIds.has(loss.id)) {
          result.push(loss);
          insertedLossIds.add(loss.id);
        }
      }
    }

    result.push(mapPolymarketActivity(row));
  }

  return result;
}

export function mapLossPositionsToTransactions(
  positions: UserPositionRecord[] | undefined
): PortfolioTransactionRecord[] {
  return (positions ?? [])
    .filter((position) => position.currentValue === 0)
    .map((position) => mapLossPositionToTransaction(position));
}
