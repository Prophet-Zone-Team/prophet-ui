import "server-only";

import {
  AssetType,
  OrderType,
  orderToJsonV2,
  Side
} from "@polymarket/clob-client-v2";
import type {
  ApiKeyCreds,
  BalanceAllowanceResponse,
  MarketDetails,
  OpenOrder,
  OpenOrdersResponse,
  PaginationPayload,
  OrderResponse,
  TickSize
} from "@polymarket/clob-client-v2";

import type { UserActivityRecord } from "@/lib/portfolio/types";
import type {
  BidTradeSide,
  TradingOrderType,
  UserPositionRecord
} from "@/types/market";
import { getTradingHost } from "@/server/trading/clob-auth";
import { serverFetch } from "@/server/trading/server-fetch";

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

export async function fetchClobMarketDetails(
  tokenId: string
): Promise<MarketDetails | undefined> {
  const marketByTokenResponse = await serverFetch(
    `${getTradingHost()}/markets-by-token/${encodeURIComponent(tokenId)}`,
    {
      cache: "no-store"
    }
  );

  if (!marketByTokenResponse.ok) {
    throw new Error(
      `Unable to fetch CLOB market by token: ${await readResponseError(marketByTokenResponse)}`
    );
  }

  const marketByToken = (await marketByTokenResponse.json()) as {
    condition_id?: unknown;
    c?: unknown;
  };
  const conditionId =
    parseConditionId(marketByToken.condition_id) ??
    parseConditionId(marketByToken.c);

  if (!conditionId) {
    return undefined;
  }

  const marketResponse = await serverFetch(
    `${getTradingHost()}/clob-markets/${encodeURIComponent(conditionId)}`,
    {
      cache: "no-store"
    }
  );

  if (!marketResponse.ok) {
    throw new Error(
      `Unable to fetch CLOB market details: ${await readResponseError(marketResponse)}`
    );
  }

  return (await marketResponse.json()) as MarketDetails;
}

export async function fetchClobBestPrices(
  tokenId: string
): Promise<ClobBestPrices> {
  const response = await serverFetch(
    `${getTradingHost()}/book?token_id=${encodeURIComponent(tokenId)}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch CLOB order book: ${await readResponseError(response)}`
    );
  }

  const book = (await response.json()) as {
    bids?: Array<{ price?: unknown }>;
    asks?: Array<{ price?: unknown }>;
  };

  return {
    bestBid: maxPrice(book.bids),
    bestAsk: minPrice(book.asks)
  };
}

export async function fetchUserBalanceAllowance({
  address,
  credentials,
  signatureType,
  tokenId
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
      asset_type: AssetType.COLLATERAL
    }
  });
  const conditional = tokenId
    ? await getBalanceAllowance({
        address,
        credentials,
        signatureType,
        params: {
          asset_type: AssetType.CONDITIONAL,
          token_id: tokenId
        }
      })
    : undefined;

  return {
    collateral,
    conditional
  };
}

export async function updateUserBalanceAllowance({
  address,
  credentials,
  signatureType,
  tokenId
}: {
  address: string;
  credentials: ApiKeyCreds;
  signatureType: number;
  tokenId?: string;
}) {
  if (tokenId) {
    await updateBalanceAllowance({
      address,
      credentials,
      signatureType,
      params: {
        asset_type: AssetType.CONDITIONAL,
        token_id: tokenId
      }
    });
  } else {
    await updateBalanceAllowance({
      address,
      credentials,
      signatureType,
      params: {
        asset_type: AssetType.COLLATERAL
      }
    });
  }
}

export async function fetchUserOpenOrders({
  address,
  credentials,
  market,
  tokenId
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

  const url =
    params.size > 0
      ? `${getTradingHost()}${requestPath}?${params.toString()}`
      : `${getTradingHost()}${requestPath}`;
  const response = await serverFetch(url, {
    method: "GET",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "GET",
      requestPath
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch open orders: ${await readResponseError(response)}`
    );
  }

  const payload = (await response.json()) as
    | OpenOrdersResponse
    | PaginationPayload
    | null;

  return normalizeOpenOrdersResponse(payload);
}

export function normalizeOpenOrdersResponse(
  payload: OpenOrdersResponse | PaginationPayload | null | undefined
): OpenOrder[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data as OpenOrder[];
  }

  return [];
}

export async function cancelUserOrder({
  address,
  credentials,
  orderId
}: {
  address: string;
  credentials: ApiKeyCreds;
  orderId: string;
}): Promise<unknown> {
  const requestPath = "/order";
  const body = JSON.stringify({
    orderID: orderId
  });
  const response = await serverFetch(`${getTradingHost()}${requestPath}`, {
    method: "DELETE",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "DELETE",
      requestPath,
      body
    }),
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Unable to cancel order: ${await readResponseError(response)}`
    );
  }

  return response.json();
}

export async function fetchUserActivity({
  userAddress,
  limit = 25,
  offset = 0
}: {
  userAddress: string;
  limit?: number;
  offset?: number;
}): Promise<UserActivityRecord[]> {
  const params = new URLSearchParams({
    user: userAddress,
    type: "TRADE",
    limit: String(Math.max(1, Math.min(limit, 500))),
    offset: String(Math.max(0, Math.min(offset, 10000))),
    sortBy: "TIMESTAMP",
    sortDirection: "DESC"
  });

  const response = await serverFetch(
    `https://data-api.polymarket.com/activity?${params.toString()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch user activity: ${await readResponseError(response)}`
    );
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload)
    ? payload
        .filter(isPolymarketActivityRecord)
        .map(normalizeUserActivityRecord)
    : [];
}

export async function fetchUserPositions({
  userAddress,
  conditionIds,
  limit = 100
}: {
  userAddress: string;
  conditionIds?: string[];
  limit?: number;
}): Promise<UserPositionRecord[]> {
  const params = new URLSearchParams({
    // user: userAddress,
    user: "0xdd3c16a48bAb4A55784C8d371FBaCf43bBC423C3",
    limit: String(Math.max(1, Math.min(limit, 500))),
    sizeThreshold: "0",
    sortBy: "CURRENT",
    sortDirection: "DESC"
  });

  if (conditionIds?.length) {
    params.set("market", conditionIds.join(","));
  }

  const response = await serverFetch(
    `https://data-api.polymarket.com/positions?${params.toString()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch user positions: ${await readResponseError(response)}`
    );
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload) ? payload.filter(isUserPositionRecord) : [];
}

export async function postSignedUserOrder({
  address,
  credentials,
  payload
}: {
  address: string;
  credentials: ApiKeyCreds;
  payload: SignedUserOrderPayload;
}): Promise<OrderResponse> {
  const requestPath = "/order";
  const signedOrder = normalizeSignedOrderV2(payload.order);

  if (!signedOrder) {
    throw new Error(
      "Signed order payload is missing required CLOB submission fields."
    );
  }

  const body = JSON.stringify(
    orderToJsonV2(
      signedOrder,
      credentials.key,
      payload.orderType as OrderType,
      payload.postOnly ?? false,
      payload.deferExec ?? false
    )
  );
  const response = await serverFetch(`${getTradingHost()}${requestPath}`, {
    method: "POST",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "POST",
      requestPath,
      body
    }),
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Unable to submit signed user order: ${await readResponseError(response)}`
    );
  }

  return (await response.json()) as OrderResponse;
}

const MAX_BATCH_ORDERS = 15;

export async function postSignedUserOrders({
  address,
  credentials,
  payloads
}: {
  address: string;
  credentials: ApiKeyCreds;
  payloads: SignedUserOrderPayload[];
}): Promise<unknown[]> {
  if (payloads.length === 0) {
    throw new Error("At least one signed order is required.");
  }

  if (payloads.length > MAX_BATCH_ORDERS) {
    throw new Error(
      `Too many orders in payload: ${payloads.length}, max allowed: ${MAX_BATCH_ORDERS}`
    );
  }

  const requestPath = "/orders";
  const bodyItems = payloads.map((payload) => {
    const signedOrder = normalizeSignedOrderV2(payload.order);

    if (!signedOrder) {
      throw new Error(
        "Signed order payload is missing required CLOB submission fields."
      );
    }

    return orderToJsonV2(
      signedOrder,
      credentials.key,
      payload.orderType as OrderType,
      payload.postOnly ?? false,
      payload.deferExec ?? false
    );
  });
  const body = JSON.stringify(bodyItems);
  const response = await serverFetch(`${getTradingHost()}${requestPath}`, {
    method: "POST",
    headers: await createUserL2Headers({
      address,
      credentials,
      method: "POST",
      requestPath,
      body
    }),
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Unable to submit signed user orders: ${await readResponseError(response)}`
    );
  }

  const result = (await response.json()) as unknown;

  if (!Array.isArray(result)) {
    throw new Error("Unexpected batch order response from CLOB.");
  }

  return result;
}

export function mapTradeSide(side: BidTradeSide): Side {
  return side === "buy" ? Side.BUY : Side.SELL;
}

export function isSupportedOrderType(
  value: unknown
): value is TradingOrderType {
  return value === "GTC" || value === "FOK" || value === "FAK";
}

export function isSupportedTickSize(value: unknown): value is TickSize {
  return (
    value === "0.1" ||
    value === "0.01" ||
    value === "0.001" ||
    value === "0.0001"
  );
}

export interface ClobTokenSigningMeta {
  negRisk: boolean;
  tickSize: TickSize;
  bestAsk?: number;
  bestBid?: number;
}

export async function fetchClobTokenSigningMeta(
  tokenId: string
): Promise<ClobTokenSigningMeta> {
  const [negRiskResponse, tickSizeResponse, bookPrices] = await Promise.all([
    serverFetch(
      `${getTradingHost()}/neg-risk?token_id=${encodeURIComponent(tokenId)}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" }
      }
    ),
    serverFetch(
      `${getTradingHost()}/tick-size?token_id=${encodeURIComponent(tokenId)}`,
      {
        cache: "no-store",
        headers: { accept: "application/json" }
      }
    ),
    fetchClobBestPrices(tokenId).catch(() => ({
      bestAsk: undefined,
      bestBid: undefined
    }))
  ]);

  let negRisk = negRiskResponse.ok
    ? parseNegRiskValue(
        (await negRiskResponse.json()) as { neg_risk?: unknown }
      )
    : undefined;
  let tickSize = tickSizeResponse.ok
    ? normalizeClobTickSize(
        ((await tickSizeResponse.json()) as { minimum_tick_size?: unknown })
          .minimum_tick_size
      )
    : undefined;

  if (negRisk === undefined || tickSize === undefined) {
    const fallback = await fetchClobMarketMetaFallback(tokenId);

    if (negRisk === undefined && fallback.negRisk !== undefined) {
      negRisk = fallback.negRisk;
    }

    if (tickSize === undefined && fallback.tickSize !== undefined) {
      tickSize = fallback.tickSize;
    }
  }

  if (negRisk === undefined) {
    throw new Error(`Unable to resolve negRisk metadata for token ${tokenId}.`);
  }

  if (tickSize === undefined) {
    throw new Error(
      `Unable to resolve tick size metadata for token ${tokenId}.`
    );
  }

  return {
    negRisk,
    tickSize,
    bestAsk: bookPrices.bestAsk,
    bestBid: bookPrices.bestBid
  };
}

async function fetchClobMarketMetaFallback(
  tokenId: string
): Promise<{ negRisk?: boolean; tickSize?: TickSize }> {
  const marketByTokenResponse = await serverFetch(
    `${getTradingHost()}/markets-by-token/${encodeURIComponent(tokenId)}`,
    {
      cache: "no-store",
      headers: { accept: "application/json" }
    }
  );

  if (!marketByTokenResponse.ok) {
    return {};
  }

  const marketByToken = (await marketByTokenResponse.json()) as {
    condition_id?: unknown;
    c?: unknown;
  };
  const conditionId =
    parseConditionId(marketByToken.condition_id) ??
    parseConditionId(marketByToken.c);

  if (!conditionId) {
    return {};
  }

  const marketResponse = await serverFetch(
    `${getTradingHost()}/clob-markets/${encodeURIComponent(conditionId)}`,
    {
      cache: "no-store",
      headers: { accept: "application/json" }
    }
  );

  if (!marketResponse.ok) {
    return {};
  }

  const payload = (await marketResponse.json()) as {
    nr?: unknown;
    mts?: unknown;
  };

  return {
    negRisk: parseNegRiskValue({ neg_risk: payload.nr }),
    tickSize: normalizeClobTickSize(payload.mts)
  };
}

function parseNegRiskValue(payload: {
  neg_risk?: unknown;
}): boolean | undefined {
  if (payload.neg_risk === true || payload.neg_risk === "true") {
    return true;
  }

  if (payload.neg_risk === false || payload.neg_risk === "false") {
    return false;
  }

  return undefined;
}

function normalizeClobTickSize(value: unknown): TickSize | undefined {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (parsed === 0.1) {
    return "0.1";
  }

  if (parsed === 0.01) {
    return "0.01";
  }

  if (parsed === 0.001) {
    return "0.001";
  }

  if (parsed === 0.0001) {
    return "0.0001";
  }

  return undefined;
}

function normalizeSignedOrderV2(order: unknown) {
  const serialized = serializeSignedOrderForClob(order);

  if (!serialized) {
    return undefined;
  }

  return {
    salt: serialized.salt.toString(),
    maker: serialized.maker,
    signer: serialized.signer,
    tokenId: serialized.tokenId,
    makerAmount: serialized.makerAmount,
    takerAmount: serialized.takerAmount,
    side: serialized.side as Side,
    signatureType: serialized.signatureType as 3,
    timestamp: serialized.timestamp,
    expiration: serialized.expiration,
    metadata: serialized.metadata,
    builder: serialized.builder,
    signature: serialized.signature
  };
}

export function serializeSignedOrderForClob(
  order: unknown
): ClobSignedOrderPayload | undefined {
  if (!order || typeof order !== "object") {
    return undefined;
  }

  const input = order as Partial<Record<keyof ClobSignedOrderPayload, unknown>>;
  const salt = parseSafeInteger(input.salt);
  const signatureType = parseSafeInteger(input.signatureType);
  const side = parseSide(input.side);
  const maker = parseAddress(input.maker);
  const signer = parseAddress(input.signer);
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
    tokenId,
    makerAmount,
    takerAmount,
    side,
    signatureType,
    timestamp,
    expiration,
    metadata,
    builder,
    signature
  };
}

async function getBalanceAllowance({
  address,
  credentials,
  signatureType,
  params
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
    signature_type: signatureType.toString()
  });

  if (params.token_id) {
    searchParams.set("token_id", params.token_id);
  }

  const response = await serverFetch(
    `${getTradingHost()}${requestPath}?${searchParams.toString()}`,
    {
      method: "GET",
      headers: await createUserL2Headers({
        address,
        credentials,
        method: "GET",
        requestPath
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch balance/allowance: ${await readResponseError(response)}`
    );
  }

  return (await response.json()) as BalanceAllowanceResponse;
}

async function updateBalanceAllowance({
  address,
  credentials,
  signatureType,
  params
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
    signature_type: signatureType.toString()
  });

  if (params.token_id) {
    searchParams.set("token_id", params.token_id);
  }

  const response = await serverFetch(
    `${getTradingHost()}${requestPath}?${searchParams.toString()}`,
    {
      method: "GET",
      headers: await createUserL2Headers({
        address,
        credentials,
        method: "GET",
        requestPath
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to update balance/allowance cache: ${await readResponseError(response)}`
    );
  }
}

function parseSafeInteger(value: unknown): number | undefined {
  const parsed =
    typeof value === "string" && value.trim() ? Number(value) : value;

  if (
    typeof parsed !== "number" ||
    !Number.isSafeInteger(parsed) ||
    parsed < 0
  ) {
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

function minPrice(
  levels: Array<{ price?: unknown }> | undefined
): number | undefined {
  const prices = parsePrices(levels);

  return prices.length > 0 ? Math.min(...prices) : undefined;
}

function maxPrice(
  levels: Array<{ price?: unknown }> | undefined
): number | undefined {
  const prices = parsePrices(levels);

  return prices.length > 0 ? Math.max(...prices) : undefined;
}

function parsePrices(levels: Array<{ price?: unknown }> | undefined): number[] {
  return (levels ?? [])
    .map((level) =>
      typeof level.price === "string" || typeof level.price === "number"
        ? Number(level.price)
        : Number.NaN
    )
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

interface PolymarketActivityRecord {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: string;
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: "BUY" | "SELL";
  outcomeIndex: number;
  title: string;
  slug: string;
  icon?: string;
  eventSlug?: string;
  outcome: string;
}

function isPolymarketActivityRecord(
  value: unknown
): value is PolymarketActivityRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<PolymarketActivityRecord>;

  return (
    record.type === "TRADE" &&
    typeof record.proxyWallet === "string" &&
    typeof record.timestamp === "number" &&
    typeof record.conditionId === "string" &&
    typeof record.size === "number" &&
    typeof record.usdcSize === "number" &&
    typeof record.transactionHash === "string" &&
    typeof record.price === "number" &&
    typeof record.asset === "string" &&
    (record.side === "BUY" || record.side === "SELL") &&
    typeof record.outcomeIndex === "number" &&
    typeof record.title === "string" &&
    typeof record.slug === "string" &&
    typeof record.outcome === "string"
  );
}

function normalizeUserActivityRecord(
  record: PolymarketActivityRecord
): UserActivityRecord {
  return {
    id: `${record.transactionHash}:${record.asset}:${record.side}:${record.timestamp}`,
    proxyWallet: record.proxyWallet,
    timestamp: record.timestamp,
    conditionId: record.conditionId,
    type: "TRADE",
    size: record.size,
    usdcSize: record.usdcSize,
    transactionHash: record.transactionHash,
    price: record.price,
    asset: record.asset,
    side: record.side,
    outcomeIndex: record.outcomeIndex,
    title: record.title,
    slug: record.slug,
    icon: record.icon,
    eventSlug: record.eventSlug,
    outcome: record.outcome
  };
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
  body
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
    POLY_PASSPHRASE: credentials.passphrase
  };
}

async function createHmacSignature(
  secret: string,
  message: string
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is required to sign Polymarket L2 requests.");
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    decodeBase64Url(secret).buffer as ArrayBuffer,
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

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
    const payload = (await response.json()) as {
      error?: string;
      errorMsg?: string;
      message?: string;
    };
    return (
      payload.error ??
      payload.errorMsg ??
      payload.message ??
      `${response.status} ${response.statusText}`
    );
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
