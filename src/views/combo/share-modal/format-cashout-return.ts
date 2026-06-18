export function formatCashoutReturnPercent(
  stakeAmount: number,
  cashoutAmount: number
): string | null {
  if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
    return null;
  }

  if (!Number.isFinite(cashoutAmount)) {
    return null;
  }

  const percent = ((cashoutAmount - stakeAmount) / stakeAmount) * 100;
  const rounded = Math.round(percent);

  if (rounded > 0) {
    return `+${rounded}%`;
  }

  if (rounded < 0) {
    return `${rounded}%`;
  }

  return "0%";
}
