export function formatComboBalanceLabel(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatComboMultiplierLabel(value: number): string {
  const formatted = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1).replace(/\.0$/, "");

  return `${formatted}x`;
}

export function formatComboPicksLabel(count: number): string {
  return count === 1 ? "1 Pick" : `${count} Picks`;
}
