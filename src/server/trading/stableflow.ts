import "server-only";

import { OpenAPI, SFA, type QuoteRequest, type SubmitDepositTxRequest } from "@stableflow/core";

let tokenConfigured = false;

function ensureStableflowConfigured() {
  const jwt = process.env.STABLEFLOW_JWT_TOKEN?.trim();

  OpenAPI.DEBUG = false;

  if (!jwt) {
    throw new Error("STABLEFLOW_JWT_TOKEN is not configured.");
  }

  if (!tokenConfigured) {
    OpenAPI.TOKEN = jwt;
    tokenConfigured = true;
  }
}

export async function getStableflowTokens() {
  ensureStableflowConfigured();
  return SFA.getTokens();
}

export async function getStableflowQuote(requestBody: QuoteRequest) {
  ensureStableflowConfigured();
  return SFA.getQuote(requestBody);
}

export async function getStableflowExecutionStatus(depositAddress: string, depositMemo?: string) {
  ensureStableflowConfigured();
  return SFA.getExecutionStatus(depositAddress, depositMemo);
}

export async function submitStableflowDepositTx(requestBody: SubmitDepositTxRequest) {
  ensureStableflowConfigured();
  return SFA.submitDepositTx(requestBody);
}
