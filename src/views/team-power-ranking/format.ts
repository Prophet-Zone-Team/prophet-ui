export function formatTitleProbability(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatAdvanceOdds(value: number): string {
  return `${Math.round(value)}%`;
}

/** @deprecated Use formatAdvanceOdds — kept for analytics widget imports */
export function formatRoundOf16Probability(value: number): string {
  return formatAdvanceOdds(value);
}
