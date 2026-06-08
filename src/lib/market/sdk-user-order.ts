"use client";

import {
  OrderBuilder,
  OrderType,
  Side,
  SignatureTypeV2
} from "@polymarket/clob-client-v2";
import type { TickSize } from "@polymarket/clob-client-v2";

import { fetchJson } from "@/lib/team/client-fetch";
import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import type { SignedUserOrderPayload } from "@/lib/market/user-order";
import { createViemClobWalletClient } from "@/lib/trading/viem-clob-signer";
import type { WalletClient } from "viem";
import { isLimitOrderType } from "@/lib/market/order-math";
import type { TradingOrderType } from "@/types/market";

const POLYGON_CHAIN_ID = 137;
const ZERO_TAKER = "0x0000000000000000000000000000000000000000" as const;
const EXCHANGE_V2 = "0xE111180000d2663C0091e4f400237545B87B996B";
const NEG_RISK_EXCHANGE_V2 = "0xe2222d279d744050d28e00520010520000310F59";
const BUILDER_CODE_PATTERN = /^0x[a-fA-F0-9]{64}$/;

interface TradingConfigResponse {
  builderCode?: string;
}

let cachedBuilderCode: string | undefined;
let builderCodeRequest: Promise<string | undefined> | null = null;

interface SdkSignedOrderV2 {
  salt: string;
  maker: string;
  signer: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: "BUY" | "SELL";
  signatureType: number;
  timestamp: string;
  expiration: string;
  metadata: string;
  builder: string;
  signature: string;
}

interface ClobSigningMeta {
  negRisk: boolean;
  tickSize: TickSize;
  bestAsk?: number;
  bestBid?: number;
  previewNegRisk: boolean;
}

export async function buildSdkSignedUserOrder({
  preview,
  walletAddress,
  funderAddress,
  orderType,
  expiration,
  signer,
  builderCode
}: {
  preview: BidOrderPreview;
  walletAddress: string;
  funderAddress: string;
  orderType: TradingOrderType;
  expiration?: string;
  signer?: WalletClient;
  builderCode?: string;
}): Promise<SignedUserOrderPayload> {
  if (!preview.tokenId) {
    throw new Error(
      "A real Polymarket token ID is required before signing an order."
    );
  }

  const resolvedSigner =
    signer ?? (await createViemClobWalletClient(walletAddress));
  const orderBuilder = new OrderBuilder(
    resolvedSigner,
    POLYGON_CHAIN_ID,
    SignatureTypeV2.POLY_1271,
    funderAddress
  );
  const [signingMeta, resolvedBuilderCode] = await Promise.all([
    resolveSigningOptions(preview),
    resolveOrderBuilderCode(builderCode)
  ]);
  const options = {
    tickSize: signingMeta.tickSize,
    negRisk: signingMeta.negRisk
  };
  const side = preview.tradeSide === "buy" ? Side.BUY : Side.SELL;
  const marketOrderPrice = resolveMarketOrderPrice(
    preview,
    orderType,
    signingMeta
  );
  const limitExpiration =
    expiration !== undefined && expiration !== "0"
      ? Number(expiration)
      : undefined;
  const builderCodeField = resolvedBuilderCode
    ? { builderCode: resolvedBuilderCode }
    : {};

  const signedOrder = isLimitOrderType(orderType)
      ? await orderBuilder.buildOrder(
          {
            tokenID: preview.tokenId,
            price: preview.sidePrice,
            size: preview.shareSize,
            side,
            ...builderCodeField,
            ...(limitExpiration !== undefined &&
            Number.isFinite(limitExpiration)
              ? { expiration: limitExpiration }
              : {})
          },
          options,
          2
        )
      : await orderBuilder.buildMarketOrder(
          {
            tokenID: preview.tokenId,
            amount: resolveMarketOrderAmount(preview),
            price: marketOrderPrice,
            side,
            orderType: orderType === "FOK" ? OrderType.FOK : OrderType.FAK,
            ...builderCodeField
          },
          options,
          2
        );

  if (process.env.NODE_ENV === "development") {
    const debugOrder = signedOrder as SdkSignedOrderV2;
    console.info("[sdk-user-order] signed order debug", {
      negRisk: options.negRisk,
      previewNegRisk: signingMeta.previewNegRisk,
      tickSize: options.tickSize,
      exchangeUsed: options.negRisk ? NEG_RISK_EXCHANGE_V2 : EXCHANGE_V2,
      marketOrderAmount: resolveMarketOrderAmount(preview),
      marketOrderPrice,
      previewSidePrice: preview.sidePrice,
      bestAsk: signingMeta.bestAsk,
      bestBid: signingMeta.bestBid,
      signatureLength: debugOrder.signature.length,
      maker: debugOrder.maker,
      signer: debugOrder.signer,
      makerAmount: debugOrder.makerAmount,
      takerAmount: debugOrder.takerAmount,
      builder: debugOrder.builder
    });
  }

  return toSignedUserOrderPayload(signedOrder as SdkSignedOrderV2, orderType);
}

function toSignedUserOrderPayload(
  signedOrder: SdkSignedOrderV2,
  orderType: TradingOrderType
): SignedUserOrderPayload {
  return {
    order: {
      salt: signedOrder.salt,
      maker: signedOrder.maker,
      signer: signedOrder.signer,
      taker: ZERO_TAKER,
      tokenId: signedOrder.tokenId,
      makerAmount: signedOrder.makerAmount,
      takerAmount: signedOrder.takerAmount,
      side: signedOrder.side,
      signatureType: signedOrder.signatureType,
      timestamp: signedOrder.timestamp,
      expiration: signedOrder.expiration,
      metadata:
        signedOrder.metadata as SignedUserOrderPayload["order"]["metadata"],
      builder:
        signedOrder.builder as SignedUserOrderPayload["order"]["builder"],
      signature:
        signedOrder.signature as SignedUserOrderPayload["order"]["signature"]
    },
    orderType,
    postOnly: false,
    deferExec: false
  };
}

function isValidBuilderCode(value: string | undefined): value is string {
  return Boolean(value && BUILDER_CODE_PATTERN.test(value));
}

async function resolveOrderBuilderCode(
  builderCode?: string
): Promise<string | undefined> {
  if (isValidBuilderCode(builderCode)) {
    return builderCode;
  }

  if (cachedBuilderCode) {
    return cachedBuilderCode;
  }

  if (!builderCodeRequest) {
    builderCodeRequest = fetchJson<TradingConfigResponse>("/api/trading/config")
      .then((config) => {
        if (isValidBuilderCode(config.builderCode)) {
          cachedBuilderCode = config.builderCode;
          return config.builderCode;
        }

        return undefined;
      })
      .catch(() => undefined)
      .finally(() => {
        builderCodeRequest = null;
      });
  }

  return builderCodeRequest;
}

async function resolveSigningOptions(preview: BidOrderPreview): Promise<ClobSigningMeta> {
  const previewNegRisk = preview.negRisk ?? false;

  const meta = await fetchJson<{
    negRisk: boolean;
    tickSize: TickSize;
    bestAsk?: number;
    bestBid?: number;
  }>(
    `/api/trading/market-signing-meta?tokenId=${encodeURIComponent(preview.tokenId!)}`
  );

  return {
    negRisk: meta.negRisk,
    tickSize: meta.tickSize ?? toSupportedTickSize(preview.tickSize),
    bestAsk: meta.bestAsk,
    bestBid: meta.bestBid,
    previewNegRisk
  };
}

function resolveMarketOrderPrice(
  preview: BidOrderPreview,
  orderType: TradingOrderType,
  signingMeta: ClobSigningMeta
): number {
  if (isLimitOrderType(orderType)) {
    return preview.sidePrice;
  }

  if (preview.tradeSide === "buy") {
    return signingMeta.bestAsk ?? preview.sidePrice;
  }

  return signingMeta.bestBid ?? preview.sidePrice;
}

function toSupportedTickSize(tickSize: BidOrderPreview["tickSize"]): TickSize {
  if (
    tickSize === "0.1" ||
    tickSize === "0.01" ||
    tickSize === "0.001" ||
    tickSize === "0.0001"
  ) {
    return tickSize;
  }

  return "0.01";
}

function resolveMarketOrderAmount(preview: BidOrderPreview): number {
  if (preview.tradeSide === "sell") {
    return preview.shareSize;
  }

  const minOrderSize = preview.minOrderSize ?? 1;
  const amount = preview.inputAmount ?? preview.estimatedCost;

  if (amount < minOrderSize) {
    throw new Error(
      `Market buy orders must be at least $${minOrderSize.toFixed(2)}. Increase the amount and try again.`
    );
  }

  return amount;
}