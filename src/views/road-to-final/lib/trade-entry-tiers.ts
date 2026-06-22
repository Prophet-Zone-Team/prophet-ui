export const TRADE_ENTRY_TIERS = [
  { thresholdUsdc: 10, entries: 1 },
  { thresholdUsdc: 100, entries: 2 },
  { thresholdUsdc: 500, entries: 3 },
  { thresholdUsdc: 1500, entries: 4 },
  { thresholdUsdc: 5000, entries: 5 },
] as const;

export const MAX_GUESS_CHANCES = 5;

export function getMaxTradeTierThreshold(): number {
  return TRADE_ENTRY_TIERS[TRADE_ENTRY_TIERS.length - 1].thresholdUsdc;
}
