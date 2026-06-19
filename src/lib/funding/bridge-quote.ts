import { formatUnits, parseUnits } from "viem";

import type { FundingAsset } from "@/config/funding";
import { POLYMARKET_USD } from "@/config/funding";
import { isValidBridgeRecipientAddress } from "@/lib/funding/recipient-validation";
import { fetchJson } from "@/lib/team/client-fetch";
import type { BridgeQuoteRequest, BridgeQuoteResponse } from "@/types/funding";
import { QuoteResponse } from "@stableflow/core";
import Big from "big.js";

export const DEFAULT_DEPOSIT_QUOTE_RECIPIENT = "0x17eC161f126e82A8ba337f4022d574DBEaFef575";

export interface DepositQuoteParams {
  token: FundingAsset;
  amount: string;
}

export interface WithdrawQuoteParams {
  token: FundingAsset;
  amount: string;
  recipientAddress: string;
}

export function buildDepositQuoteRequest({ token, amount }: DepositQuoteParams): BridgeQuoteRequest | undefined {
  const normalized = amount.trim().replace(/,/g, "");

  if (!normalized || Number(normalized) <= 0) {
    return undefined;
  }

  let fromAmountBaseUnit: string;

  try {
    fromAmountBaseUnit = parseUnits(normalized, token.decimals).toString();
  } catch {
    return undefined;
  }

  return {
    fromAmountBaseUnit,
    fromChainId: String(token.chainId),
    fromTokenAddress: token.address,
    recipientAddress: DEFAULT_DEPOSIT_QUOTE_RECIPIENT,
    toChainId: String(POLYMARKET_USD.chainId),
    toTokenAddress: POLYMARKET_USD.address,
  };
}

export function buildWithdrawQuoteRequest({
  token,
  amount,
  recipientAddress,
}: WithdrawQuoteParams): BridgeQuoteRequest | undefined {
  const normalizedRecipient = recipientAddress.trim();

  if (!isValidBridgeRecipientAddress(String(token.chainId), normalizedRecipient)) {
    return undefined;
  }

  const normalized = amount.trim().replace(/,/g, "");

  if (!normalized || Number(normalized) <= 0) {
    return undefined;
  }

  let fromAmountBaseUnit: string;

  try {
    fromAmountBaseUnit = parseUnits(normalized, POLYMARKET_USD.decimals).toString();
  } catch {
    return undefined;
  }

  return {
    fromAmountBaseUnit,
    fromChainId: String(POLYMARKET_USD.chainId),
    fromTokenAddress: POLYMARKET_USD.address,
    recipientAddress: normalizedRecipient,
    toChainId: String(token.chainId),
    toTokenAddress: token.address,
  };
}

export async function fetchBridgeQuote(
  request: BridgeQuoteRequest,
  signal?: AbortSignal,
): Promise<BridgeQuoteResponse> {
  return fetchJson<BridgeQuoteResponse>("/api/trading/bridge/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });
}

export function formatQuoteCheckoutTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "--";
  }

  if (ms < 60000) {
    return "~" + ms / 1000 + "s";
  }

  const minutes = Math.ceil(ms / 60_000);

  if (minutes === 1) {
    return "~1 min";
  }

  return `~${minutes} min`;
}

export function formatQuoteTokenAmount(baseUnits: string, decimals: number): string {
  try {
    return formatUnits(BigInt(baseUnits), decimals);
  } catch {
    return "--";
  }
}

export interface QuoteBreakdownDisplay {
  networkCost: number;
  priceImpactPercent: number;
  maxSlippagePercent: number;
}

export function mapQuoteToBreakdown(quote: BridgeQuoteResponse): QuoteBreakdownDisplay {
  const breakdown = quote.estFeeBreakdown;

  return {
    networkCost: breakdown.gasUsd ?? 0,
    priceImpactPercent: breakdown.totalImpact ?? breakdown.swapImpact ?? 0,
    maxSlippagePercent: breakdown.maxSlippage ?? 0,
  };
}

export function mapStableflowQuoteToBreakdown(quote: QuoteResponse): QuoteBreakdownDisplay {
  const { quote: data, quoteRequest } = quote;

  const { amountOutUsd, amountInUsd } = data;
  const { slippageTolerance } = quoteRequest;

  const priceImpactPercent = Big(amountInUsd || 0)
    .minus(amountOutUsd || 0)
    .div(amountInUsd || 0)
    .times(100)
    .toNumber();
  const maxSlippagePercent = slippageTolerance ? Big(slippageTolerance).div(100).toNumber() : 0;
  const networkCost = amountInUsd ? Big(amountInUsd).minus(amountOutUsd).toNumber() : 0;

  return {
    networkCost,
    priceImpactPercent,
    maxSlippagePercent,
  };
}
