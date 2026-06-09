export function normalizePriceChange(value: number | undefined): number {
  if (value === undefined) {
    return 0;
  }

  const points = Math.abs(value) <= 1 ? value * 100 : value;

  if (Math.abs(points) < 1) {
    return Math.round(points * 1000) / 1000;
  }

  return Math.round(points * 10) / 10;
}
