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

export interface ValidateWithdrawAmountOptions {
  minWithdrawUsd?: number;
}

export function validateWithdrawAmount(
  amount: number | undefined,
  maxAmount: number,
  options?: ValidateWithdrawAmountOptions,
): string | undefined {
  if (amount === undefined || amount <= 0) {
    return "Enter an amount greater than zero.";
  }

  const minWithdrawUsd = options?.minWithdrawUsd ?? 0;

  if (minWithdrawUsd > 0 && amount < minWithdrawUsd) {
    return `Minimum withdrawal is $${minWithdrawUsd}.`;
  }

  if (amount > maxAmount) {
    return "Amount exceeds available balance.";
  }

  return undefined;
}
