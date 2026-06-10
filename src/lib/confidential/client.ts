import { fetchJson } from "@/lib/team/client-fetch";

import type {
  ConfidentialAuthenticateResponse,
  ConfidentialBalancesResponse,
  ConfidentialChallengeResponse,
  ConfidentialGenerateIntentResponse,
  ConfidentialQuoteResponse,
  ConfidentialSessionView,
  ConfidentialStatusResponse,
  ConfidentialSubmitIntentResponse,
  ConfidentialSubmitTxResponse,
  ConfidentialTokensResponse,
} from "@/lib/confidential/types";

const BASE = "/api/confidential";

export function getConfidentialSession(): Promise<ConfidentialSessionView> {
  return fetchJson<ConfidentialSessionView>(`${BASE}/session`);
}

export function clearConfidentialSession(): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`${BASE}/session`, { method: "DELETE" });
}

export function requestConfidentialChallenge(
  eoaAddress: string,
): Promise<ConfidentialChallengeResponse> {
  return fetchJson<ConfidentialChallengeResponse>(`${BASE}/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eoaAddress }),
  });
}

export function authenticateConfidential(payload: {
  eoaAddress: string;
  message: string;
  signature: string;
}): Promise<ConfidentialAuthenticateResponse> {
  return fetchJson<ConfidentialAuthenticateResponse>(`${BASE}/auth/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getConfidentialTokens(): Promise<ConfidentialTokensResponse> {
  return fetchJson<ConfidentialTokensResponse>(`${BASE}/tokens`);
}

export function requestConfidentialTopupQuote(payload: {
  originAssetId: string;
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
}): Promise<ConfidentialQuoteResponse> {
  return fetchJson<ConfidentialQuoteResponse>(`${BASE}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function submitConfidentialDepositTx(payload: {
  txHash: string;
  depositAddress: string;
  memo?: string;
}): Promise<ConfidentialSubmitTxResponse> {
  return fetchJson<ConfidentialSubmitTxResponse>(`${BASE}/submit-tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getConfidentialStatus(
  depositAddress: string,
  depositMemo?: string,
): Promise<ConfidentialStatusResponse> {
  const params = new URLSearchParams({ depositAddress });

  if (depositMemo) {
    params.set("depositMemo", depositMemo);
  }

  return fetchJson<ConfidentialStatusResponse>(`${BASE}/status?${params.toString()}`);
}

export function getConfidentialBalances(): Promise<ConfidentialBalancesResponse> {
  return fetchJson<ConfidentialBalancesResponse>(`${BASE}/balances`);
}

export function requestConfidentialWithdrawQuote(payload: {
  amountBaseUnits: string;
}): Promise<ConfidentialQuoteResponse> {
  return fetchJson<ConfidentialQuoteResponse>(`${BASE}/withdraw-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function generateConfidentialIntent(payload: {
  depositAddress: string;
}): Promise<ConfidentialGenerateIntentResponse> {
  return fetchJson<ConfidentialGenerateIntentResponse>(`${BASE}/generate-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function submitConfidentialIntent(payload: {
  message: string;
  signature: string;
}): Promise<ConfidentialSubmitIntentResponse> {
  return fetchJson<ConfidentialSubmitIntentResponse>(`${BASE}/submit-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
