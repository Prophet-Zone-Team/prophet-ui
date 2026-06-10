import "server-only";

import {
  isMarketOrderType,
  isSignedMarketOrderPriceWithinGuard,
} from "@/lib/market/order-math";
import { fetchClobBestPrices } from "@/server/trading/clob-user-client";
// import { ZERO_ORDER_BUILDER_CODE } from "@/server/trading/builder-code";
import type { SignedOrderContext } from "@/server/trading/balances";
import type {
  TradingOrderType,
  UserOrderPreview,
  UserOrderStatus
} from "@/types/market";

export type SubmitSignedOrderPayload = {
  order?: unknown;
  orderType?: TradingOrderType;
  postOnly?: boolean;
  deferExec?: boolean;
  preview?: UserOrderPreview;
};

export function validateSignedOrderPayload(
  payload: SubmitSignedOrderPayload
): string | undefined {
  if (!payload.order || typeof payload.order !== "object") {
    return "Missing signed order payload.";
  }

  const orderType = payload.orderType ?? "FAK";

  if (
    orderType !== "FAK" &&
    orderType !== "GTC" &&
    orderType !== "GTD" &&
    orderType !== "FOK"
  ) {
    return "Only FAK, FOK, GTC, and GTD orders are supported by this user flow.";
  }

  return undefined;
}

export function validateSignedOrderOwnership({
  order,
  funderAddress,
  signatureType
}: {
  order: SignedOrderContext;
  funderAddress?: string;
  signatureType: number;
}): string | undefined {
  if (signatureType !== 3 || order.signatureType !== 3) {
    return "This trading flow only accepts signature type 3 deposit-wallet orders.";
  }

  const normalizedFunder = normalizeAddress(funderAddress);

  if (!normalizedFunder) {
    return "Trading session is missing a deposit wallet / funder address.";
  }

  if (
    normalizeAddress(order.maker) !== normalizedFunder ||
    normalizeAddress(order.signer) !== normalizedFunder
  ) {
    return "Signed order maker and signer must match the session deposit wallet / funder address.";
  }

  const normalizedTaker = normalizeAddress(order.taker);

  if (
    normalizedTaker &&
    normalizedTaker !== "0x0000000000000000000000000000000000000000"
  ) {
    return "Only open CLOB limit orders with the zero taker address are supported.";
  }

  // if (order.builder.toLowerCase() !== ZERO_ORDER_BUILDER_CODE) {
  //   return "Signed user orders must use a zero builder code.";
  // }

  return undefined;
}

export function validateSignedOrderPreview(
  preview: UserOrderPreview | undefined,
  order: SignedOrderContext,
  orderType: TradingOrderType
): string | undefined {
  if (!preview) {
    return "Missing safe order preview metadata.";
  }

  if (preview.tokenId !== order.tokenId) {
    return "Order preview token does not match signed order token.";
  }

  if (preview.orderType !== orderType) {
    return "Order preview order type does not match submitted order type.";
  }

  const expectedSide = order.side === "BUY" ? "buy" : "sell";

  if (preview.side !== expectedSide) {
    return "Order preview side does not match signed order side.";
  }

  if (
    !Number.isFinite(preview.limitPrice) ||
    preview.limitPrice <= 0 ||
    preview.limitPrice >= 1
  ) {
    return "Order preview limit price is invalid.";
  }

  if (!Number.isFinite(preview.size) || preview.size <= 0) {
    return "Order preview size is invalid.";
  }

  if (
    !preview.teamId ||
    !["yes", "no"].includes(preview.outcome) ||
    !["buy", "sell"].includes(preview.side)
  ) {
    return "Order preview metadata is incomplete.";
  }

  return undefined;
}

export async function validateSignedOrderExecutionPrice(
  order: SignedOrderContext,
  preview: UserOrderPreview,
  orderType: TradingOrderType,
): Promise<string | undefined> {
  const orderPrice = getSignedOrderPrice(order);

  if (orderPrice === undefined) {
    return "Unable to derive signed order price.";
  }

  try {
    const prices = await fetchClobBestPrices(order.tokenId);

    if (order.side === "BUY" && prices.bestAsk === undefined) {
      return "No current ask liquidity is available for this token. Refresh the market before submitting.";
    }

    if (order.side === "SELL" && prices.bestBid === undefined) {
      return "No current bid liquidity is available for this token. Refresh the market before submitting.";
    }

    if (isMarketOrderType(orderType)) {
      const withinGuard = isSignedMarketOrderPriceWithinGuard({
        orderPrice,
        tradeSide: preview.side,
        sidePrice: preview.limitPrice,
        bestAsk: prices.bestAsk,
        bestBid: prices.bestBid,
        tickSize: preview.tickSize,
      });

      if (!withinGuard) {
        if (order.side === "BUY" && prices.bestAsk !== undefined) {
          return `Order price ${(orderPrice * 100).toFixed(1)}c is far above the current best ask ${(prices.bestAsk * 100).toFixed(1)}c. Refresh the ticket before submitting.`;
        }

        if (order.side === "SELL" && prices.bestBid !== undefined) {
          return `Order price ${(orderPrice * 100).toFixed(1)}c is far below the current best bid ${(prices.bestBid * 100).toFixed(1)}c. Refresh the ticket before submitting.`;
        }
      }

      return undefined;
    }

    const tolerance = 0.02;

    if (
      order.side === "BUY" &&
      prices.bestAsk !== undefined &&
      orderPrice > prices.bestAsk + tolerance
    ) {
      return `Order price ${(orderPrice * 100).toFixed(1)}c is far above the current best ask ${(prices.bestAsk * 100).toFixed(1)}c. Refresh the ticket before submitting.`;
    }

    if (
      order.side === "SELL" &&
      prices.bestBid !== undefined &&
      orderPrice < prices.bestBid - tolerance
    ) {
      return `Order price ${(orderPrice * 100).toFixed(1)}c is far below the current best bid ${(prices.bestBid * 100).toFixed(1)}c. Refresh the ticket before submitting.`;
    }
  } catch (error) {
    return `Unable to verify the current CLOB order book before submission: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  return undefined;
}

export function getSubmittedOrderStatus(response: unknown): UserOrderStatus {
  if (!response || typeof response !== "object") {
    return "submitted";
  }

  const responseObject = response as {
    success?: unknown;
    status?: unknown;
  };

  if (responseObject.success === false) {
    return "rejected";
  }

  if (typeof responseObject.status !== "string") {
    return "submitted";
  }

  const status = responseObject.status.toLowerCase();

  if (status.includes("matched") || status.includes("fill")) {
    return "filled";
  }

  if (status.includes("open") || status.includes("live")) {
    return "open";
  }

  if (status.includes("cancel")) {
    return "cancelled";
  }

  if (status.includes("reject") || status.includes("fail")) {
    return "rejected";
  }

  return "submitted";
}

function getSignedOrderPrice(order: SignedOrderContext): number | undefined {
  if (order.makerAmount <= 0 || order.takerAmount <= 0) {
    return undefined;
  }

  return order.side === "BUY"
    ? order.makerAmount / order.takerAmount
    : order.takerAmount / order.makerAmount;
}

function normalizeAddress(address: string | undefined) {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return undefined;
  }

  return address.toLowerCase();
}
