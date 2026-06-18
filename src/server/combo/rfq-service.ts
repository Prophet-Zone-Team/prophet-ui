import "server-only";

import type { ApiKeyCreds } from "@polymarket/clob-client-v2";

import {
  estimateMultiplierFromBlendedPrice,
  parseE6Value,
  toE6String,
} from "@/lib/combo/estimate-preview";
import { serverFetch } from "@/server/trading/server-fetch";
import type {
  ComboExchangeV3Order,
  ComboExecutionStatus,
  ComboQuoteSnapshot,
  ComboRfqAcceptRequest,
  ComboRfqQuoteRequest,
  ComboRfqStatus,
  ComboSubmitResult,
} from "@/types/combo";

import { getComboRfqApiUrl } from "./fetch-combo-markets";

const REQUESTER_ACCEPT_WINDOW_MS = 10_000;
const QUOTE_POLL_INTERVAL_MS = 100;
const QUOTE_POLL_TIMEOUT_MS = 2_000;

interface RfqSnapshotResponse {
  request?: {
    rfq_id?: string;
    leg_position_ids?: string[];
    yes_position_id?: string;
    no_position_id?: string;
  };
  status?: ComboRfqStatus;
  quote_id?: string;
  confirmation_ends_at?: number;
  bundle?: {
    blended_price_e6?: string;
    requested_shares_e6?: string;
    requested_notional_e6?: string;
  };
  execution?: {
    status?: string;
    tx_hash?: string;
    error?: string;
  };
}

interface TradingSessionContext {
  walletAddress: string;
  funderAddress: string;
  credentials: ApiKeyCreds;
}

export async function requestComboRfqQuote(
  input: ComboRfqQuoteRequest,
  session: TradingSessionContext,
): Promise<ComboQuoteSnapshot> {
  validateQuoteRequest(input);

  const createPath = process.env.POLYMARKET_COMBO_RFQ_CREATE_PATH?.trim() || "/v1/requester/rfqs";
  const body = JSON.stringify({
    leg_position_ids: input.legs.map((leg) => leg.legPositionId),
    direction: "BUY",
    side: "YES",
    requested_size: {
      unit: "notional",
      value_e6: toE6String(input.bidAmountUsd),
    },
    auth_address: session.walletAddress,
    signer_address: session.funderAddress,
    maker_address: session.funderAddress,
    signature_type: 3,
  });

  const createResponse = await postRfqJson<{ rfq_id?: string; snapshot?: RfqSnapshotResponse }>(
    createPath,
    body,
    session,
  );

  const rfqId = createResponse.rfq_id ?? createResponse.snapshot?.request?.rfq_id;

  if (!rfqId) {
    throw new Error("Combo RFQ did not return an rfq_id.");
  }

  const snapshot = await waitForExecutableQuote(rfqId, session);

  return mapSnapshotToQuote(snapshot, input.bidAmountUsd);
}

export async function acceptComboRfqQuote(
  input: ComboRfqAcceptRequest,
  session: TradingSessionContext,
): Promise<ComboSubmitResult> {
  if (!input.rfqId?.trim() || !input.quoteId?.trim()) {
    throw new Error("rfqId and quoteId are required.");
  }

  validateSignedOrder(input.signedOrder);

  const acceptPath =
    process.env.POLYMARKET_COMBO_RFQ_ACCEPT_PATH?.trim() ||
    `/v1/requester/rfqs/${encodeURIComponent(input.rfqId)}/accept`;

  const body = JSON.stringify({
    rfq_id: input.rfqId,
    quote_id: input.quoteId,
    auth_address: session.walletAddress,
    signer_address: session.funderAddress,
    maker_address: session.funderAddress,
    signature_type: input.signedOrder.signatureType,
    signed_order: {
      salt: input.signedOrder.salt,
      maker: input.signedOrder.maker,
      signer: input.signedOrder.signer,
      tokenId: input.signedOrder.tokenId,
      makerAmount: input.signedOrder.makerAmount,
      takerAmount: input.signedOrder.takerAmount,
      side: input.signedOrder.side,
      signatureType: input.signedOrder.signatureType,
      timestamp: input.signedOrder.timestamp,
      metadata: input.signedOrder.metadata,
      builder: input.signedOrder.builder,
      signature: input.signedOrder.signature,
    },
  });

  const response = await postRfqJson<RfqSnapshotResponse>(acceptPath, body, session);

  return mapSnapshotToSubmitResult(input.rfqId, response);
}

export async function pollComboRfqExecution(
  rfqId: string,
  session: TradingSessionContext,
): Promise<ComboSubmitResult> {
  const pollPath =
    process.env.POLYMARKET_COMBO_RFQ_POLL_PATH?.trim() ||
    `/v1/requester/rfqs/${encodeURIComponent(rfqId)}`;

  const snapshot = await getRfqJson<RfqSnapshotResponse>(pollPath, session);

  return mapSnapshotToSubmitResult(rfqId, snapshot);
}

async function waitForExecutableQuote(
  rfqId: string,
  session: TradingSessionContext,
): Promise<RfqSnapshotResponse> {
  const pollPath =
    process.env.POLYMARKET_COMBO_RFQ_POLL_PATH?.trim() ||
    `/v1/requester/rfqs/${encodeURIComponent(rfqId)}`;
  const startedAt = Date.now();

  while (Date.now() - startedAt < QUOTE_POLL_TIMEOUT_MS) {
    const snapshot = await getRfqJson<RfqSnapshotResponse>(pollPath, session);

    if (
      snapshot.status === "AWAITING_REQUESTER_ACCEPTANCE" &&
      snapshot.quote_id &&
      snapshot.bundle?.blended_price_e6
    ) {
      return snapshot;
    }

    if (
      snapshot.status === "FAILED" ||
      snapshot.status === "EXPIRED" ||
      snapshot.status === "REJECTED" ||
      snapshot.status === "CANCELED"
    ) {
      throw new Error(`Combo RFQ ended with status ${snapshot.status}.`);
    }

    await sleep(QUOTE_POLL_INTERVAL_MS);
  }

  throw new Error("Combo RFQ quote timed out before a maker quote was returned.");
}

function mapSnapshotToQuote(
  snapshot: RfqSnapshotResponse,
  bidAmountUsd: number,
): ComboQuoteSnapshot {
  const rfqId = snapshot.request?.rfq_id;
  const quoteId = snapshot.quote_id;
  const yesPositionId = snapshot.request?.yes_position_id;
  const blendedPrice = parseE6Value(snapshot.bundle?.blended_price_e6);
  const shares = parseE6Value(snapshot.bundle?.requested_shares_e6);
  const notionalUsd = parseE6Value(snapshot.bundle?.requested_notional_e6) || bidAmountUsd;

  if (!rfqId || !quoteId || !yesPositionId || blendedPrice <= 0 || shares <= 0) {
    throw new Error("Combo RFQ returned an incomplete executable quote.");
  }

  const makerAmountBaseUnits =
    snapshot.bundle?.requested_notional_e6 ?? toE6String(notionalUsd);
  const takerAmountBaseUnits =
    snapshot.bundle?.requested_shares_e6 ?? toE6String(shares);

  return {
    rfqId,
    quoteId,
    status: snapshot.status ?? "AWAITING_REQUESTER_ACCEPTANCE",
    blendedPrice,
    shares,
    notionalUsd,
    multiplier: estimateMultiplierFromBlendedPrice(blendedPrice),
    estimatedToWin: shares,
    yesPositionId,
    legPositionIds: snapshot.request?.leg_position_ids ?? [],
    expiresAt:
      snapshot.confirmation_ends_at ??
      Date.now() + REQUESTER_ACCEPT_WINDOW_MS,
    makerAmountBaseUnits,
    takerAmountBaseUnits,
  };
}

function mapSnapshotToSubmitResult(
  rfqId: string,
  snapshot: RfqSnapshotResponse,
): ComboSubmitResult {
  const status = mapExecutionStatus(snapshot.status, snapshot.execution?.status);

  return {
    rfqId,
    executionStatus: status,
    txHash: snapshot.execution?.tx_hash,
    error: snapshot.execution?.error,
  };
}

function mapExecutionStatus(
  rfqStatus?: ComboRfqStatus,
  executionStatus?: string,
): ComboExecutionStatus {
  const normalized = executionStatus?.toUpperCase();

  if (normalized === "CONFIRMED") {
    return "CONFIRMED";
  }

  if (normalized === "MINED") {
    return "MINED";
  }

  if (normalized === "MATCHED") {
    return "MATCHED";
  }

  if (normalized === "FAILED" || rfqStatus === "FAILED" || rfqStatus === "REJECTED") {
    return "FAILED";
  }

  if (rfqStatus === "FILLED") {
    return "CONFIRMED";
  }

  if (rfqStatus === "EXECUTING" || rfqStatus === "AWAITING_MAKER_CONFIRMATION") {
    return "MATCHED";
  }

  return "PENDING";
}

async function postRfqJson<T>(
  path: string,
  body: string,
  session: TradingSessionContext,
): Promise<T> {
  const headers = await createRfqL2Headers({
    address: session.walletAddress,
    credentials: session.credentials,
    method: "POST",
    requestPath: path,
    body,
  });

  const response = await serverFetch(`${getComboRfqApiUrl()}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body,
    cache: "no-store",
  });

  return parseRfqJsonResponse<T>(response);
}

async function getRfqJson<T>(
  path: string,
  session: TradingSessionContext,
): Promise<T> {
  const headers = await createRfqL2Headers({
    address: session.walletAddress,
    credentials: session.credentials,
    method: "GET",
    requestPath: path,
  });

  const response = await serverFetch(`${getComboRfqApiUrl()}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...headers,
    },
    cache: "no-store",
  });

  return parseRfqJsonResponse<T>(response);
}

async function parseRfqJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Combo RFQ request failed: ${await readResponseError(response)}`);
  }

  return (await response.json()) as T;
}

async function createRfqL2Headers({
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
}): Promise<Record<string, string>> {
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
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function validateQuoteRequest(input: ComboRfqQuoteRequest) {
  if (!Array.isArray(input.legs) || input.legs.length === 0) {
    throw new Error("At least one combo leg is required.");
  }

  if (!Number.isFinite(input.bidAmountUsd) || input.bidAmountUsd <= 0) {
    throw new Error("bidAmountUsd must be greater than zero.");
  }

  for (const leg of input.legs) {
    if (!leg.legPositionId?.trim()) {
      throw new Error("Each combo leg must include a legPositionId.");
    }
  }
}

function validateSignedOrder(order: ComboExchangeV3Order) {
  if (!order.signature?.trim()) {
    throw new Error("signedOrder.signature is required.");
  }

  if (!order.tokenId?.trim() || !order.makerAmount?.trim() || !order.takerAmount?.trim()) {
    throw new Error("signedOrder is incomplete.");
  }
}

async function readResponseError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Fall through.
  }

  return response.statusText || `HTTP ${response.status}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
