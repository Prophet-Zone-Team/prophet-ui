function toFiniteNumber(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolvePriceBucket(price: number | string | undefined): string | undefined {
  const value = toFiniteNumber(price);

  if (value === undefined) {
    return undefined;
  }

  if (value < 0.1) {
    return "0-0.10";
  }

  if (value < 0.3) {
    return "0.10-0.30";
  }

  if (value < 0.5) {
    return "0.30-0.50";
  }

  if (value < 0.7) {
    return "0.50-0.70";
  }

  return "0.70-1.00";
}

export function resolveAmountBucket(amount: number | string | undefined): string | undefined {
  const value = toFiniteNumber(amount);

  if (value === undefined) {
    return undefined;
  }

  if (value < 10) {
    return "0-10";
  }

  if (value < 50) {
    return "10-50";
  }

  if (value < 100) {
    return "50-100";
  }

  if (value < 500) {
    return "100-500";
  }

  return "500+";
}

export function resolveSizeBucket(size: number | string | undefined): string | undefined {
  const value = toFiniteNumber(size);

  if (value === undefined) {
    return undefined;
  }

  if (value < 10) {
    return "0-10";
  }

  if (value < 50) {
    return "10-50";
  }

  if (value < 100) {
    return "50-100";
  }

  if (value < 500) {
    return "100-500";
  }

  return "500+";
}
