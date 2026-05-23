import { formatNumber } from "@/utils";

import { WITHDRAW_ESTIMATE_RATE } from "@/views/portfolio/withdraw/config";

export function parseWithdrawAmount(raw: string): number | undefined {
  const normalized = raw.trim().replace(/,/g, "");

  if (!normalized) {
    return undefined;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}

export function formatWithdrawEstimate(amount: number, receiveSymbol: string) {
  const receiveAmount = Math.floor(amount * WITHDRAW_ESTIMATE_RATE * 100) / 100;
  const fiatEstimate = receiveAmount * 0.999;

  return {
    receiveLabel: `${receiveAmount.toFixed(2)} ${receiveSymbol}`,
    fiatLabel: `~${formatNumber(fiatEstimate, 2, true, { round: 0 })}`
  };
}

export function validateWithdrawAmount(
  amount: number | undefined,
  maxAmount: number
): string | undefined {
  if (amount === undefined || amount <= 0) {
    return "Enter an amount greater than zero.";
  }

  if (amount > maxAmount) {
    return "Amount exceeds available balance.";
  }

  return undefined;
}
