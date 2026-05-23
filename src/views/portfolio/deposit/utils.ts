import { formatPortfolioMoney } from "@/lib/portfolio/portfolio-format";

export function formatTokenBalance(value: number, symbol: string): string {
  if (symbol === "ETH" || symbol === "TRON") {
    return value.toFixed(4);
  }

  return value.toFixed(2);
}

export function formatTokenBalanceUsd(value: number): string {
  return formatPortfolioMoney(value);
}

export function parseAmountInput(raw: string): number | undefined {
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

export function formatAmountInputValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const decimals = value >= 100 ? 2 : 4;
  return value.toFixed(decimals).replace(/\.?0+$/, "") || "0";
}

export function applyBalancePercent(maxAmount: number, percent: number): number {
  const amount = (maxAmount * percent) / 100;
  return Math.floor(amount * 10000) / 10000;
}

export function validateDepositAmount(
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
