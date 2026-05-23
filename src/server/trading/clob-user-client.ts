import "server-only";

import { AssetType, Side } from "@polymarket/clob-client-v2";
import type {
  ApiKeyCreds,
  BalanceAllowanceResponse,
  MarketDetails,
  OpenOrder,
  OpenOrdersResponse,
  OrderResponse,
  TickSize,
} from "@polymarket/clob-client-v2";

import type { BidTradeSide, TradingOrderType, UserPositionRecord } from "../../types/market";
import { getTradingHost } from "./clob-auth";

export interface SignedUserOrderPayload {
  order: unknown;
  orderType: TradingOrderType;
  postOnly?: boolean;
  deferExec?: boolean;
}

export interface ClobSignedOrderPayload {
  salt: number;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: string;
  signatureType: number;
  timestamp: string;
  expiration: string;
  metadata: string;
  builder: string;
  signature: string;
}

export interface UserBalanceAllowanceSnapshot {
  collateral?: BalanceAllowanceResponse;
  conditional?: BalanceAllowanceResponse;
}

export interface ClobBestPrices {
  bestBid?: number;
  bestAsk?: number;
}

export async function fetchClobMarketDetails(tokenId: string): Promise<MarketDetails | undefined> {
  const marketByTokenResponse = await fetch(`${getTradingHost()}/markets-by-token/${encodeURIComponent(tokenId)}`, {
    cache: "no-store",
  });

  if (!marketByTokenResponse.ok) {
    throw new Error(`Unable to fetch CLOB market by token: ${await readResponseError(marketByTokenResponse)}`);
  }

  const marketByToken = (await marketByTokenResponse.json()) as { condition_id?: unknown; c?: unknown };
  const conditionId = parseConditionId(marketByToken.condition_id) ?? parseConditionId(marketByToken.c);

  if (!conditionId) {
    return undefined;
  }

  const marketResponse = await fetch(`${getTradingHost()}/clob-markets/${encodeURIComponent(conditionId)}`, {
    cache: "no-store",
  });

  if (!marketResponse.ok) {
    throw new Error(`Unable to fetch CLOB market details: ${await readResponseError(marketResponse)}`);
  }

  return (await marketResponse.json()) as MarketDetails;
}

export async function fetchClobBestPrices(tokenId: string): Promise<ClobBestPrices> {
  const response = await fetch(`${getTradingHost()}/book?token_id=${encodeURIComponent(tokenId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch CLOB order book: ${await readResponseError(response)}`);
  }

  const book = (await response.json()) as {
    bids?: Array<{ price?: unknown }>;
    asks?: Array<{ price?: unknown }>;
  };

  return {
    bestBid: maxPrice(book.bids),
    bestAsk: minPrice(book.asks),
  };
}

export async function fetchUserBalanceAllowance({
  address,
  credentials,
  signatureType,
  tokenId,
}: {
  address: string;
  credentials: ApiKeyCreds;
  signatureType: number;
  tokenId?: string;
}): Promise<UserBalanceAllowanceSnapshot> {
  const collateral = await getBalanceAllowance({
    address,
    credentials,
    signatureType,
    params: {
      asset_type: AssetType.COLLATERAL,
    },
  });
  const conditional = tokenId
    ? await getBalanceAllowance({
        address,
        credentials,
        signatureType,
        params: {
          asset_type: AssetType.CONDITIONAL,
          token_id: tokenId,
        },
      })
    : undefined;

  return {
    collateral,
    conditional,
  };
}

export async function updateUserBalanceAllowance({
  address,
  credentials,
  signatureType,
  tokenId,
}: {
  address: string;
  credentials: ApiKeyCreds;
  signatureType: number;
  tokenId?: string;
}) {
  await updateBalanceAllowance({
    address,
    credentials,
    signatureType,
    params: {
      asset_type: AssetType.COLLATERAL,
    },
  });

  if (tokenId) {
    await updateBalanceAllowance({
      address,
      credentials,
      signatureType,
      params: {
        asset_type: AssetType.CONDITIONAL,
        token_id: tokenId,
      },
    });
  }
}

export async function fetchUserOpenOrders({
  address,
  credentials,
  market,
  tokenId,
}: {
  address: string;
  credentials: ApiKeyCreds;
  market?: string;
  tokenId?: string;
}): Promise<OpenOrder[]> {
  const requestPath = "/data/orders";
  const params = new URLSearchParams();

  if (market) {
    params.set("market", market);
  }

  if (tokenId) {
    params.set("asset_id", tokenId);
  }

  const url = params.size > 0 ? `${getTradingHost()}${requestPath}?${params.toString()}` : `${getTradingHost()}${requestPath}`;
  const response = await fetch(url, {
    method: "GET",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "GET",
      requestPath,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch open orders: ${await readResponseError(response)}`);
  }

  return ((await response.json()) as OpenOrdersResponse) ?? [];
}

export async function cancelUserOrder({
  address,
  credentials,
  orderId,
}: {
  address: string;
  credentials: ApiKeyCreds;
  orderId: string;
}): Promise<unknown> {
  const requestPath = "/order";
  const body = JSON.stringify({
    orderID: orderId,
  });
  const response = await fetch(`${getTradingHost()}${requestPath}`, {
    method: "DELETE",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "DELETE",
      requestPath,
      body,
    }),
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to cancel order: ${await readResponseError(response)}`);
  }

  return response.json();
}

export async function fetchUserPositions({
  userAddress,
  conditionIds,
  limit = 100,
}: {
  userAddress: string;
  conditionIds?: string[];
  limit?: number;
}): Promise<UserPositionRecord[]> {
  const params = new URLSearchParams({
    user: userAddress,
    limit: String(Math.max(1, Math.min(limit, 500))),
    sizeThreshold: "0",
  });

  if (conditionIds?.length) {
    params.set("market", conditionIds.join(","));
  }

  const response = await fetch(`https://data-api.polymarket.com/positions?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch user positions: ${await readResponseError(response)}`);
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload) ? payload.filter(isUserPositionRecord) : [];
}

export async function postSignedUserOrder({
  address,
  credentials,
  payload,
}: {
  address: string;
  credentials: ApiKeyCreds;
  payload: SignedUserOrderPayload;
}): Promise<OrderResponse> {
  const requestPath = "/order";
  const order = serializeSignedOrderForClob(payload.order);

  if (!order) {
    throw new Error("Signed order payload is missing required CLOB submission fields.");
  }

  const body = JSON.stringify({
    order,
    owner: credentials.key,
    orderType: payload.orderType,
    postOnly: payload.postOnly ?? false,
    deferExec: payload.deferExec ?? false,
  });
  const response = await fetch(`${getTradingHost()}${requestPath}`, {
    method: "POST",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "POST",
      requestPath,
      body,
    }),
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to submit signed user order: ${await readResponseError(response)}`);
  }

  return (await response.json()) as OrderResponse;
}

export function mapTradeSide(side: BidTradeSide): Side {
  return side === "buy" ? Side.BUY : Side.SELL;
}

export function isSupportedOrderType(value: unknown): value is TradingOrderType {
  return value === "GTC" || value === "FOK" || value === "FAK";
}

export function isSupportedTickSize(value: unknown): value is TickSize {
  return value === "0.1" || value === "0.01" || value === "0.001" || value === "0.0001";
}

export function serializeSignedOrderForClob(order: unknown): ClobSignedOrderPayload | undefined {
  if (!order || typeof order !== "object") {
    return undefined;
  }

  const input = order as Partial<Record<keyof ClobSignedOrderPayload, unknown>>;
  const salt = parseSafeInteger(input.salt);
  const signatureType = parseSafeInteger(input.signatureType);
  const side = parseSide(input.side);
  const maker = parseAddress(input.maker);
  const signer = parseAddress(input.signer);
  const taker = parseAddress(input.taker);
  const tokenId = parseIntegerString(input.tokenId);
  const makerAmount = parseIntegerString(input.makerAmount);
  const takerAmount = parseIntegerString(input.takerAmount);
  const timestamp = parseIntegerString(input.timestamp);
  const expiration = parseIntegerString(input.expiration);
  const metadata = parseHex(input.metadata);
  const builder = parseHex(input.builder);
  const signature = parseHex(input.signature);

  if (
    salt === undefined ||
    signatureType === undefined ||
    !side ||
    !maker ||
    !signer ||
    !taker ||
    !tokenId ||
    !makerAmount ||
    !takerAmount ||
    !timestamp ||
    !expiration ||
    !metadata ||
    !builder ||
    !signature
  ) {
    return undefined;
  }

  return {
    salt,
    maker,
    signer,
    taker,
    tokenId,
    makerAmount,
    takerAmount,
    side,
    signatureType,
    timestamp,
    expiration,
    metadata,
    builder,
    signature,
  };
}

async function getBalanceAllowance({
  address,
  credentials,
  signatureType,
  params,
}: {
  address: string;
  credentials: ApiKeyCreds;
  signatureType: number;
  params: {
    asset_type: AssetType;
    token_id?: string;
  };
}): Promise<BalanceAllowanceResponse> {
  const requestPath = "/balance-allowance";
  const searchParams = new URLSearchParams({
    asset_type: params.asset_type,
    signature_type: signatureType.toString(),
  });

  if (params.token_id) {
    searchParams.set("token_id", params.token_id);
  }

  const response = await fetch(`${getTradingHost()}${requestPath}?${searchParams.toString()}`, {
    method: "GET",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "GET",
      requestPath,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch balance/allowance: ${await readResponseError(response)}`);
  }

  return (await response.json()) as BalanceAllowanceResponse;
}

async function updateBalanceAllowance({
  address,
  credentials,
  signatureType,
  params,
}: {
  address: string;
  credentials: ApiKeyCreds;
  signatureType: number;
  params: {
    asset_type: AssetType;
    token_id?: string;
  };
}): Promise<void> {
  const requestPath = "/balance-allowance/update";
  const searchParams = new URLSearchParams({
    asset_type: params.asset_type,
    signature_type: signatureType.toString(),
  });

  if (params.token_id) {
    searchParams.set("token_id", params.token_id);
  }

  const response = await fetch(`${getTradingHost()}${requestPath}?${searchParams.toString()}`, {
    method: "GET",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "GET",
      requestPath,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to update balance/allowance cache: ${await readResponseError(response)}`);
  }
}

function parseSafeInteger(value: unknown): number | undefined {
  const parsed = typeof value === "string" && value.trim() ? Number(value) : value;

  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function parseIntegerString(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return undefined;
  }

  return value;
}

function minPrice(levels: Array<{ price?: unknown }> | undefined): number | undefined {
  const prices = parsePrices(levels);

  return prices.length > 0 ? Math.min(...prices) : undefined;
}

function maxPrice(levels: Array<{ price?: unknown }> | undefined): number | undefined {
  const prices = parsePrices(levels);

  return prices.length > 0 ? Math.max(...prices) : undefined;
}

function parsePrices(levels: Array<{ price?: unknown }> | undefined): number[] {
  return (levels ?? [])
    .map((level) => (typeof level.price === "string" || typeof level.price === "number" ? Number(level.price) : Number.NaN))
    .filter((price) => Number.isFinite(price) && price > 0 && price < 1);
}

function parseAddress(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return undefined;
  }

  return value;
}

function parseHex(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]+$/.test(value)) {
    return undefined;
  }

  return value;
}

function parseConditionId(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(value)) {
    return undefined;
  }

  return value;
}

function parseSide(value: unknown): "BUY" | "SELL" | undefined {
  if (value === "BUY" || value === "SELL") {
    return value;
  }

  return undefined;
}

function isUserPositionRecord(value: unknown): value is UserPositionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<UserPositionRecord>;

  return (
    typeof record.proxyWallet === "string" &&
    typeof record.asset === "string" &&
    typeof record.conditionId === "string" &&
    typeof record.size === "number" &&
    typeof record.avgPrice === "number" &&
    typeof record.currentValue === "number" &&
    typeof record.title === "string" &&
    typeof record.outcome === "string"
  );
}

async function createUserL2Headers({
  address,
  credentials,
  method,
  requestPath,
  body,
}: {
  address: string;
  credentials: ApiKeyCreds;
  method: string;
  requestPath: string;
  body?: string;
}): Promise<HeadersInit> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  let message = `${timestamp}${method}${requestPath}`;

  if (body !== undefined) {
    message += body;
  }

  return {
    POLY_ADDRESS: address,
    POLY_SIGNATURE: await createHmacSignature(credentials.secret, message),
    POLY_TIMESTAMP: timestamp,
    POLY_API_KEY: credentials.key,
    POLY_PASSPHRASE: credentials.passphrase,
  };
}

async function createHmacSignature(secret: string, message: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is required to sign Polymarket L2 requests.");
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    decodeBase64Url(secret).buffer as ArrayBuffer,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));

  return bytesToBase64Url(new Uint8Array(signature));
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Uint8Array(bytes.buffer.slice(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_");
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; errorMsg?: string; message?: string };
    return payload.error ?? payload.errorMsg ?? payload.message ?? `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
