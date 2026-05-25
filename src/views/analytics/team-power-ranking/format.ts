export function formatTitleProbability(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatRoundOf16Probability(value: number): string {
  return `${Math.round(value)}%`;
}
