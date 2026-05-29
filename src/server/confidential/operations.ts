import "server-only";

import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript";

import { deriveIntentsUserId } from "@/server/confidential/identity";
import {
  oneClickGenerateIntent,
  oneClickGetExecutionStatus,
  oneClickGetQuote,
  oneClickSubmitIntent,
  type ConfidentialQuoteParams,
} from "@/server/confidential/one-click-client";
import type { ConfidentialSessionRecord } from "@/server/confidential/session-store";

export type ConfidentialOperationKind = "shield" | "unshield";

export function buildShieldQuoteParams({
  walletAddress,
  assetId,
  amountBaseUnits,
}: {
  walletAddress: string;
  assetId: string;
  amountBaseUnits: string;
}): ConfidentialQuoteParams {
  const intentsUserId = deriveIntentsUserId(walletAddress);

  return {
    originAsset: assetId,
    destinationAsset: assetId,
    amount: amountBaseUnits,
    depositType: "ORIGIN_CHAIN",
    recipientType: "CONFIDENTIAL_INTENTS",
    refundType: "CONFIDENTIAL_INTENTS",
    refundTo: intentsUserId,
    recipient: intentsUserId,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 100,
  };
}

export function buildUnshieldQuoteParams({
  walletAddress,
  assetId,
  amountBaseUnits,
  funderAddress,
}: {
  walletAddress: string;
  assetId: string;
  amountBaseUnits: string;
  funderAddress: string;
}): ConfidentialQuoteParams {
  const intentsUserId = deriveIntentsUserId(walletAddress);

  return {
    originAsset: assetId,
    destinationAsset: assetId,
    amount: amountBaseUnits,
    depositType: "CONFIDENTIAL_INTENTS",
    recipientType: "INTENTS",
    refundType: "CONFIDENTIAL_INTENTS",
    refundTo: intentsUserId,
    recipient: funderAddress,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 100,
  };
}

export async function createConfidentialQuote(
  session: ConfidentialSessionRecord,
  params: ConfidentialQuoteParams,
) {
  const quote = await oneClickGetQuote(session, params);
  const depositAddress = quote.quote?.depositAddress;

  if (!depositAddress) {
    throw new Error("Confidential quote did not return a deposit address.");
  }

  return {
    depositAddress,
    depositMemo: quote.quote?.depositMemo,
    quote,
  };
}

export async function generateConfidentialIntent(
  session: ConfidentialSessionRecord,
  depositAddress: string,
) {
  return oneClickGenerateIntent(session, {
    depositAddress,
    signerId: session.intentsUserId,
    standard: "erc191",
  });
}

export async function submitConfidentialIntent(
  session: ConfidentialSessionRecord,
  signedData: unknown,
) {
  return oneClickSubmitIntent(session, signedData);
}

export async function getConfidentialExecutionStatus(
  session: ConfidentialSessionRecord,
  depositAddress: string,
  depositMemo?: string,
) {
  const response = await oneClickGetExecutionStatus(session, depositAddress, depositMemo);
  return String(response.status ?? "PROCESSING").toUpperCase();
}

export async function pollConfidentialExecutionStatus(
  session: ConfidentialSessionRecord,
  depositAddress: string,
  depositMemo?: string,
  options?: { maxAttempts?: number; intervalMs?: number },
) {
  const maxAttempts = options?.maxAttempts ?? 120;
  const intervalMs = options?.intervalMs ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await getConfidentialExecutionStatus(session, depositAddress, depositMemo);

    if (status === "SUCCESS") {
      return { ok: true as const, status, depositAddress };
    }

    if (status === "FAILED" || status === "REFUNDED") {
      return { ok: false as const, status, depositAddress };
    }

    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }

  return { ok: false as const, status: "TIMEOUT" as const, depositAddress };
}
