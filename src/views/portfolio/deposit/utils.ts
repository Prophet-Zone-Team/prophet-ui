import { removeNumberEndZero } from "@/utils";
import Big from "big.js";

export function parseAmountInput(raw: string): string | undefined {
  const normalized = raw.trim().replace(/,/g, "");

  if (!normalized) {
    return undefined;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return normalized;
}

export function applyBalancePercent(maxAmount: string, percent: number): string {
  const amount = Big(maxAmount).times(percent).div(100);
  return removeNumberEndZero(amount.toFixed(4, Big.roundDown));
}

export function validateDepositAmount(
  amount: string | undefined,
  maxAmount: string
): string | undefined {
  if (amount === undefined || Big(amount).lte(0)) {
    return "Enter an amount greater than zero.";
  }

  if (Big(amount).gt(maxAmount)) {
    return "Amount exceeds available balance.";
  }

  return undefined;
}
