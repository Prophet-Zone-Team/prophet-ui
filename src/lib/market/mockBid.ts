export function calculatePotentialPayout(stake: number, probability: number): number {
  if (stake <= 0 || probability <= 0) {
    return 0;
  }

  return Math.round((stake / (probability / 100)) * 100) / 100;
}
