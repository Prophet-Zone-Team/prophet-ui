import { NextResponse } from "next/server";
import type { TickSize } from "@polymarket/clob-client-v2";

import type { BidTradeSide, MockBidOrderType } from "../../../../types/market";
import { getPolymarketTradingConfigStatus, submitPolymarketOrder } from "../../../../server/polymarket/orderClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitOrderPayload {
  mode?: "status" | "submit";
  tokenId?: string;
  price?: number;
  size?: number;
  tradeSide?: BidTradeSide;
  orderType?: MockBidOrderType;
  tickSize?: TickSize;
  negRisk?: boolean;
  confirmationText?: string;
}

export async function GET() {
  return NextResponse.json(getPolymarketTradingConfigStatus());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SubmitOrderPayload;

  if (payload.mode === "status") {
    return NextResponse.json(getPolymarketTradingConfigStatus());
  }

  const validationError = validateSubmitPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const order = toValidatedOrder(payload);

  try {
    const result = await submitPolymarketOrder(order);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 });
  }
}

function validateSubmitPayload(payload: SubmitOrderPayload): string | undefined {
  if (payload.confirmationText !== "PLACE REAL ORDER") {
    return "Type PLACE REAL ORDER to confirm real CLOB submission.";
  }

  if (!payload.tokenId) {
    return "Missing tokenId.";
  }

  if (!isPositiveNumber(payload.price) || payload.price <= 0 || payload.price >= 1) {
    return "Price must be between 0 and 1.";
  }

  if (!isPositiveNumber(payload.size)) {
    return "Size must be positive.";
  }

  if (payload.tradeSide !== "buy" && payload.tradeSide !== "sell") {
    return "tradeSide must be buy or sell.";
  }

  if (!isSupportedOrderType(payload.orderType)) {
    return "orderType must be GTC, FOK, or FAK.";
  }

  if (!isSupportedTickSize(payload.tickSize)) {
    return "Invalid tickSize.";
  }

  return undefined;
}

function toValidatedOrder(payload: SubmitOrderPayload) {
  if (
    !payload.tokenId ||
    !isPositiveNumber(payload.price) ||
    !isPositiveNumber(payload.size) ||
    (payload.tradeSide !== "buy" && payload.tradeSide !== "sell") ||
    !isSupportedOrderType(payload.orderType) ||
    !isSupportedTickSize(payload.tickSize)
  ) {
    throw new Error("Invalid order payload.");
  }

  return {
    tokenId: payload.tokenId,
    price: payload.price,
    size: payload.size,
    tradeSide: payload.tradeSide,
    orderType: payload.orderType,
    tickSize: payload.tickSize,
    negRisk: payload.negRisk,
  };
}

function isSupportedOrderType(value: unknown): value is "GTC" | "FOK" | "FAK" {
  return value === "GTC" || value === "FOK" || value === "FAK";
}

function isSupportedTickSize(value: unknown): value is TickSize {
  return value === "0.1" || value === "0.01" || value === "0.001" || value === "0.0001";
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
