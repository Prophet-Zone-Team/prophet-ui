import "server-only";

import {
  AssetType,
  Chain,
  ClobClient,
  OrderType,
  Side,
  SignatureTypeV2,
  type ApiKeyCreds,
  type TickSize,
} from "@polymarket/clob-client-v2";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import type { BidTradeSide, MockBidOrderType } from "../../types/market";

const DEFAULT_HOST = "https://clob.polymarket.com";
const DEFAULT_CHAIN_ID = Chain.POLYGON;
const DEFAULT_SIGNATURE_TYPE = SignatureTypeV2.POLY_1271;

export interface PolymarketOrderRequest {
  tokenId: string;
  price: number;
  size: number;
  tradeSide: BidTradeSide;
  orderType: MockBidOrderType;
  tickSize: TickSize;
  negRisk?: boolean;
  postOnly?: boolean;
}

export interface PolymarketOrderResult {
  response: unknown;
  submittedAt: string;
}

export function getPolymarketTradingConfigStatus(): {
  ready: boolean;
  missing: string[];
  funderAddress?: string;
  signatureType: SignatureTypeV2;
  enabled: boolean;
} {
  const config = readConfig();

  return {
    ready: config.enabled && config.missing.length === 0,
    missing: config.missing,
    funderAddress: config.funderAddress,
    signatureType: config.signatureType,
    enabled: config.enabled,
  };
}

export async function submitPolymarketOrder(request: PolymarketOrderRequest): Promise<PolymarketOrderResult> {
  const config = readConfig();

  if (!config.enabled) {
    throw new Error("Real Polymarket order submission is disabled. Set ENABLE_REAL_POLYMARKET_ORDERS=true to enable it.");
  }

  if (config.missing.length > 0) {
    throw new Error(`Missing Polymarket trading environment variables: ${config.missing.join(", ")}`);
  }

  const account = privateKeyToAccount(config.privateKey as Hex);
  const walletClient = createWalletClient({
    account,
    transport: http(),
  });
  const client = new ClobClient({
    host: config.host,
    chain: config.chainId,
    signer: walletClient,
    creds: config.creds,
    signatureType: config.signatureType,
    funderAddress: config.funderAddress,
    builderConfig: config.builderCode
      ? {
          builderCode: config.builderCode,
        }
      : undefined,
    throwOnError: true,
    retryOnError: true,
  });
  const orderType = toClobOrderType(request.orderType);

  await client.updateBalanceAllowance({
    asset_type: request.tradeSide === "buy" ? AssetType.COLLATERAL : AssetType.CONDITIONAL,
    token_id: request.tradeSide === "sell" ? request.tokenId : undefined,
  });

  if (orderType === OrderType.FOK || orderType === OrderType.FAK) {
    const response = await client.createAndPostMarketOrder(
      {
        tokenID: request.tokenId,
        amount: request.tradeSide === "buy" ? request.size * request.price : request.size,
        price: request.price,
        side: toClobSide(request.tradeSide),
        orderType,
      },
      { tickSize: request.tickSize, negRisk: request.negRisk },
      orderType,
    );

    return {
      response,
      submittedAt: new Date().toISOString(),
    };
  }

  const response = await client.createAndPostOrder(
    {
      tokenID: request.tokenId,
      price: request.price,
      side: toClobSide(request.tradeSide),
      size: request.size,
    },
    { tickSize: request.tickSize, negRisk: request.negRisk },
    orderType,
    request.postOnly ?? false,
  );

  return {
    response,
    submittedAt: new Date().toISOString(),
  };
}

function readConfig(): {
  host: string;
  chainId: Chain;
  privateKey?: string;
  funderAddress?: string;
  signatureType: SignatureTypeV2;
  builderCode?: string;
  enabled: boolean;
  creds?: ApiKeyCreds;
  missing: string[];
} {
  const enabled = process.env.ENABLE_REAL_POLYMARKET_ORDERS === "true";
  const host = process.env.POLYMARKET_CLOB_HOST?.trim() || DEFAULT_HOST;
  const chainId = parseChainId(process.env.POLYMARKET_CHAIN_ID ?? process.env.CHAIN_ID);
  const privateKey =
    process.env.POLYMARKET_PRIVATE_KEY?.trim() ||
    process.env.POLY_PRIVATE_KEY?.trim() ||
    process.env.PRIVATE_KEY?.trim();
  const funderAddress =
    process.env.POLYMARKET_FUNDER_ADDRESS?.trim() ||
    process.env.POLY_FUNDER_ADDRESS?.trim() ||
    process.env.DEPOSIT_WALLET?.trim();
  const apiKey =
    process.env.POLYMARKET_API_KEY?.trim() ||
    process.env.POLY_API_KEY?.trim() ||
    process.env.CLOB_API_KEY?.trim();
  const apiSecret =
    process.env.POLYMARKET_API_SECRET?.trim() ||
    process.env.POLY_API_SECRET?.trim() ||
    process.env.CLOB_SECRET?.trim();
  const apiPassphrase =
    process.env.POLYMARKET_API_PASSPHRASE?.trim() ||
    process.env.POLYMARKET_API_PASS_PHRASE?.trim() ||
    process.env.POLY_API_PASSPHRASE?.trim() ||
    process.env.POLY_API_PASS_PHRASE?.trim() ||
    process.env.CLOB_PASS_PHRASE?.trim();
  const signatureType = parseSignatureType(process.env.POLYMARKET_SIGNATURE_TYPE ?? process.env.POLY_SIGNATURE_TYPE);
  const builderCode = process.env.POLYMARKET_BUILDER_CODE?.trim() || process.env.BUILDER_CODE?.trim();
  const missing = [
    privateKey ? undefined : "POLYMARKET_PRIVATE_KEY",
    apiKey ? undefined : "POLYMARKET_API_KEY",
    apiSecret ? undefined : "POLYMARKET_API_SECRET",
    apiPassphrase ? undefined : "POLYMARKET_API_PASSPHRASE",
    signatureType === SignatureTypeV2.EOA || funderAddress ? undefined : "POLYMARKET_FUNDER_ADDRESS",
  ].filter(isString);

  return {
    host,
    chainId,
    privateKey,
    funderAddress,
    signatureType,
    builderCode,
    enabled,
    creds:
      apiKey && apiSecret && apiPassphrase
        ? {
            key: apiKey,
            secret: apiSecret,
            passphrase: apiPassphrase,
          }
        : undefined,
    missing,
  };
}

function parseChainId(value: string | undefined): Chain {
  const parsed = Number(value);

  if (parsed === Chain.AMOY) {
    return Chain.AMOY;
  }

  return DEFAULT_CHAIN_ID;
}

function parseSignatureType(value: string | undefined): SignatureTypeV2 {
  const parsed = Number(value);

  if (parsed === SignatureTypeV2.POLY_PROXY) {
    return SignatureTypeV2.POLY_PROXY;
  }

  if (parsed === SignatureTypeV2.POLY_GNOSIS_SAFE) {
    return SignatureTypeV2.POLY_GNOSIS_SAFE;
  }

  if (parsed === SignatureTypeV2.POLY_1271) {
    return SignatureTypeV2.POLY_1271;
  }

  return DEFAULT_SIGNATURE_TYPE;
}

function toClobSide(side: BidTradeSide): Side {
  return side === "buy" ? Side.BUY : Side.SELL;
}

function toClobOrderType(orderType: MockBidOrderType): OrderType {
  switch (orderType) {
    case "FAK":
      return OrderType.FAK;
    case "FOK":
      return OrderType.FOK;
    case "GTD":
      return OrderType.GTD;
    case "GTC":
      return OrderType.GTC;
  }
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}
