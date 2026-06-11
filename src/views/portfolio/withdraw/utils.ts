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

export type WithdrawAmountErrorKey =
  | "amountZero"
  | "amountBelowMinimum"
  | "amountExceedsBalance";

export interface ValidateWithdrawAmountOptions {
  minWithdrawUsd?: number;
}

export function validateWithdrawAmount(
  amount: number | undefined,
  maxAmount: number,
  options?: ValidateWithdrawAmountOptions,
): WithdrawAmountErrorKey | undefined {
  if (amount === undefined || amount <= 0) {
    return "amountZero";
  }

  const minWithdrawUsd = options?.minWithdrawUsd ?? 0;

  if (minWithdrawUsd > 0 && amount < minWithdrawUsd) {
    return "amountBelowMinimum";
  }

  if (amount > maxAmount) {
    return "amountExceedsBalance";
  }

  return undefined;
}
