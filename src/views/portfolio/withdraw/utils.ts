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
