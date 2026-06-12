import "server-only";

import { randomUUID } from "crypto";

import type {
  TradingUserSession,
  UserOrderPreview,
  UserOrderRecord,
  UserOrderStatus,
} from "@/types/market";

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

  return {
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
}

export async function recordUserOrderError(_input: {
  session: TradingUserSession;
  preview?: UserOrderPreview;
  error: string;
}): Promise<void> {
  return;
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
  return {
    id: `clob:${clobOrderId}`,
    userId: session.userId,
    walletAddress: session.walletAddress,
    funderAddress: session.funderAddress,
    clobOrderId,
    status: "cancelled",
    preview: createEmptyPreview(),
    response: redactOrderResponse(response),
    updatedAt: cancelledAt,
  };
}

export async function recordUserOrderCancelError(_input: {
  session: TradingUserSession;
  clobOrderId: string;
  error: string;
}): Promise<void> {
  return;
}

export async function recordTradingAuditEvent(_event: {
  userId: string;
  walletAddress: string;
  eventType: string;
  orderId?: string;
  clobOrderId?: string;
  detail?: Record<string, unknown>;
  createdAt?: string;
}): Promise<void> {
  return;
}

function createEmptyPreview(): UserOrderPreview {
  return {
    tokenId: "",
    teamId: "",
    outcome: "yes",
    side: "buy",
    orderType: "GTC",
    limitPrice: 0,
    size: 0,
    estimatedCost: 0,
    potentialOutcome: 0,
    tickSize: "0.01",
    stale: false,
    warnings: [],
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

function redactOrderResponse(response: unknown): unknown {
  if (!response || typeof response !== "object") {
    return response;
  }

  const { signature, ...safeResponse } = response as Record<string, unknown>;
  void signature;
  return safeResponse;
}
