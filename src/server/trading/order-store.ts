import "server-only";

import { randomUUID } from "crypto";

import type { D1Database } from "@/server/market-history/types";
import { getCloudflareD1Database } from "@/server/cloudflare/d1";
import type {
  TradingUserSession,
  UserOrderPreview,
  UserOrderRecord,
  UserOrderStatus,
  UserTradingAuditEvent,
} from "@/types/market";

interface UserTradingOrderRow {
  id: string;
  user_id: string;
  wallet_address: string;
  funder_address: string | null;
  clob_order_id: string | null;
  status: UserOrderStatus;
  preview_json: string;
  response_json: string | null;
  submitted_at: string | null;
  updated_at: string;
  error: string | null;
}

const memoryOrders = new Map<string, UserOrderRecord>();
const memoryAuditEvents = new Map<string, UserTradingAuditEvent>();

export async function recordUserOrderSubmitted({
  session,
  preview,
  response,
  status,
  submittedAt,
}: {
  session: TradingUserSession;
  preview: UserOrderPreview;
  response: unknown;
  status: UserOrderStatus;
  submittedAt: string;
}): Promise<UserOrderRecord> {
  const clobOrderId = getClobOrderId(response);
  const record: UserOrderRecord = {
    id: clobOrderId ? `clob:${clobOrderId}` : `order:${randomUUID()}`,
    userId: session.userId,
    walletAddress: session.walletAddress,
    funderAddress: session.funderAddress,
    clobOrderId,
    status,
    preview,
    response: redactOrderResponse(response),
    submittedAt,
    updatedAt: submittedAt,
  };

  await upsertOrder(record);
  await recordTradingAuditEvent({
    userId: session.userId,
    walletAddress: session.walletAddress,
    eventType: "order_submitted",
    orderId: record.id,
    clobOrderId,
    detail: {
      status,
      tokenId: preview.tokenId,
      teamId: preview.teamId,
      side: preview.side,
      outcome: preview.outcome,
    },
  });

  return record;
}

export async function recordUserOrderError({
  session,
  preview,
  error,
}: {
  session: TradingUserSession;
  preview?: UserOrderPreview;
  error: string;
}): Promise<void> {
  await recordTradingAuditEvent({
    userId: session.userId,
    walletAddress: session.walletAddress,
    eventType: "order_submit_failed",
    detail: {
      tokenId: preview?.tokenId,
      teamId: preview?.teamId,
      error,
    },
  });
}

export async function recordUserOrderCancelled({
  session,
  clobOrderId,
  response,
  cancelledAt,
}: {
  session: TradingUserSession;
  clobOrderId: string;
  response: unknown;
  cancelledAt: string;
}): Promise<UserOrderRecord | undefined> {
  const existing = await findOrderByClobOrderId(session.userId, clobOrderId);
  const updated = existing
    ? {
        ...existing,
        status: "cancelled" as const,
        response: redactOrderResponse(response),
        updatedAt: cancelledAt,
      }
    : undefined;

  if (updated) {
    await upsertOrder(updated);
  }

  await recordTradingAuditEvent({
    userId: session.userId,
    walletAddress: session.walletAddress,
    eventType: "order_cancel_requested",
    orderId: updated?.id,
    clobOrderId,
    detail: {
      knownOrder: Boolean(updated),
    },
  });

  return updated;
}

export async function recordUserOrderCancelError({
  session,
  clobOrderId,
  error,
}: {
  session: TradingUserSession;
  clobOrderId: string;
  error: string;
}): Promise<void> {
  await recordTradingAuditEvent({
    userId: session.userId,
    walletAddress: session.walletAddress,
    eventType: "order_cancel_failed",
    clobOrderId,
    detail: { error },
  });
}

export async function readUserOrderHistory(userId: string, limit = 25): Promise<UserOrderRecord[]> {
  const database = await getCloudflareD1Database();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  if (database) {
    try {
      const result = await database
        .prepare(
          `SELECT
            id,
            user_id,
            wallet_address,
            funder_address,
            clob_order_id,
            status,
            preview_json,
            response_json,
            submitted_at,
            updated_at,
            error
          FROM user_trading_orders
          WHERE user_id = ?
          ORDER BY updated_at DESC
          LIMIT ?`,
        )
        .bind(userId, safeLimit)
        .all<UserTradingOrderRow>();

      return (result.results ?? []).map(mapOrderRow);
    } catch (error) {
      console.warn("[trading.orderStore] falling back to memory history", getErrorMessage(error));
    }
  }

  return Array.from(memoryOrders.values())
    .filter((order) => order.userId === userId)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, safeLimit);
}

export async function refreshPersistedOrderStatuses({
  session,
  openOrders,
  refreshedAt,
}: {
  session: TradingUserSession;
  openOrders: Array<{ id: string; status?: string }>;
  refreshedAt: string;
}): Promise<UserOrderRecord[]> {
  const records = await readUserOrderHistory(session.userId, 100);
  const safeOpenOrders = Array.isArray(openOrders) ? openOrders : [];
  const openStatusById = new Map(
    safeOpenOrders.map((order) => [
      order.id,
      normalizeOpenOrderStatus(order.status)
    ])
  );
  const refreshed: UserOrderRecord[] = [];

  for (const record of records) {
    if (!record.clobOrderId || isTerminalStatus(record.status)) {
      refreshed.push(record);
      continue;
    }

    const openStatus = openStatusById.get(record.clobOrderId);
    const nextStatus = openStatus ?? normalizeSubmittedResponseStatus(record.response) ?? record.status;
    const updatedRecord = nextStatus !== record.status ? { ...record, status: nextStatus, updatedAt: refreshedAt } : record;

    if (updatedRecord !== record) {
      await upsertOrder(updatedRecord);
    }

    refreshed.push(updatedRecord);
  }

  await recordTradingAuditEvent({
    userId: session.userId,
    walletAddress: session.walletAddress,
    eventType: "order_status_refreshed",
    detail: {
      openOrderCount: safeOpenOrders.length,
      trackedOrderCount: records.length,
    },
  });

  return refreshed.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

export async function recordTradingAuditEvent(
  event: Omit<UserTradingAuditEvent, "id" | "createdAt"> & { createdAt?: string },
): Promise<void> {
  const auditEvent: UserTradingAuditEvent = {
    ...event,
    id: `audit:${randomUUID()}`,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };
  const database = await getCloudflareD1Database();

  memoryAuditEvents.set(auditEvent.id, auditEvent);

  if (!database) {
    return;
  }

  try {
    await database
      .prepare(
        `INSERT INTO user_trading_audit_events (
          id,
          user_id,
          wallet_address,
          event_type,
          order_id,
          clob_order_id,
          detail_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        auditEvent.id,
        auditEvent.userId,
        auditEvent.walletAddress,
        auditEvent.eventType,
        auditEvent.orderId ?? null,
        auditEvent.clobOrderId ?? null,
        auditEvent.detail ? JSON.stringify(auditEvent.detail) : null,
        auditEvent.createdAt,
      )
      .run();
  } catch (error) {
    console.warn("[trading.orderStore] audit persistence skipped", getErrorMessage(error));
  }
}

async function upsertOrder(record: UserOrderRecord): Promise<void> {
  memoryOrders.set(record.id, record);
  const database = await getCloudflareD1Database();

  if (!database) {
    return;
  }

  try {
    await writeOrder(database, record);
  } catch (error) {
    console.warn("[trading.orderStore] order persistence skipped", getErrorMessage(error));
  }
}

async function findOrderByClobOrderId(userId: string, clobOrderId: string): Promise<UserOrderRecord | undefined> {
  const memoryRecord = Array.from(memoryOrders.values()).find(
    (order) => order.userId === userId && order.clobOrderId === clobOrderId,
  );

  if (memoryRecord) {
    return memoryRecord;
  }

  const database = await getCloudflareD1Database();

  if (!database) {
    return undefined;
  }

  try {
    const result = await database
      .prepare(
        `SELECT
          id,
          user_id,
          wallet_address,
          funder_address,
          clob_order_id,
          status,
          preview_json,
          response_json,
          submitted_at,
          updated_at,
          error
        FROM user_trading_orders
        WHERE user_id = ? AND clob_order_id = ?
        LIMIT 1`,
      )
      .bind(userId, clobOrderId)
      .all<UserTradingOrderRow>();

    const row = result.results?.[0];
    return row ? mapOrderRow(row) : undefined;
  } catch (error) {
    console.warn("[trading.orderStore] order lookup skipped", getErrorMessage(error));
    return undefined;
  }
}

async function writeOrder(database: D1Database, record: UserOrderRecord): Promise<void> {
  await database
    .prepare(
      `INSERT INTO user_trading_orders (
        id,
        user_id,
        wallet_address,
        funder_address,
        clob_order_id,
        status,
        market_id,
        token_id,
        team_id,
        outcome,
        side,
        order_type,
        limit_price,
        size,
        estimated_cost,
        estimated_total_cost,
        estimated_proceeds,
        potential_outcome,
        preview_json,
        response_json,
        submitted_at,
        updated_at,
        error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        clob_order_id = excluded.clob_order_id,
        status = excluded.status,
        response_json = excluded.response_json,
        updated_at = excluded.updated_at,
        error = excluded.error`,
    )
    .bind(
      record.id,
      record.userId,
      record.walletAddress,
      record.funderAddress ?? null,
      record.clobOrderId ?? null,
      record.status,
      record.preview.marketId ?? null,
      record.preview.tokenId,
      record.preview.teamId,
      record.preview.outcome,
      record.preview.side,
      record.preview.orderType,
      record.preview.limitPrice,
      record.preview.size,
      record.preview.estimatedCost,
      record.preview.estimatedTotalCost ?? null,
      record.preview.estimatedProceeds ?? null,
      record.preview.potentialOutcome,
      JSON.stringify(record.preview),
      record.response ? JSON.stringify(record.response) : null,
      record.submittedAt ?? null,
      record.updatedAt,
      record.error ?? null,
    )
    .run();
}

function mapOrderRow(row: UserTradingOrderRow): UserOrderRecord {
  return {
    id: row.id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    funderAddress: row.funder_address ?? undefined,
    clobOrderId: row.clob_order_id ?? undefined,
    status: row.status,
    preview: parseJson(row.preview_json, undefined) as UserOrderPreview,
    response: parseJson(row.response_json, undefined),
    submittedAt: row.submitted_at ?? undefined,
    updatedAt: row.updated_at,
    error: row.error ?? undefined,
  };
}

function getClobOrderId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const value = (response as { orderID?: unknown; orderId?: unknown; id?: unknown }).orderID ??
    (response as { orderID?: unknown; orderId?: unknown; id?: unknown }).orderId ??
    (response as { orderID?: unknown; orderId?: unknown; id?: unknown }).id;

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeSubmittedResponseStatus(response: unknown): UserOrderStatus | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const status = (response as { status?: unknown }).status;
  return typeof status === "string" ? mapStatus(status) : undefined;
}

function normalizeOpenOrderStatus(status: string | undefined): UserOrderStatus {
  if (!status) {
    return "open";
  }

  return mapStatus(status);
}

function mapStatus(value: string): UserOrderStatus {
  const normalized = value.toLowerCase();

  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  if (normalized.includes("partial")) {
    return "partially_filled";
  }

  if (normalized.includes("fill") || normalized === "matched") {
    return "filled";
  }

  if (normalized.includes("open") || normalized.includes("live")) {
    return "open";
  }

  if (normalized.includes("error") || normalized.includes("fail")) {
    return "error";
  }

  return "submitted";
}

function isTerminalStatus(status: UserOrderStatus): boolean {
  return ["filled", "cancelled", "rejected", "error"].includes(status);
}

function redactOrderResponse(response: unknown): unknown {
  if (!response || typeof response !== "object") {
    return response;
  }

  const { signature, ...safeResponse } = response as Record<string, unknown>;
  void signature;
  return safeResponse;
}

function parseJson(value: string | null, fallback: unknown): unknown {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
