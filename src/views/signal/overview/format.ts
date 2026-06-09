export function formatImpactCountWithPercent(
  count: number,
  percent: number
): { count: string; percent: string } {
  const formattedPercent =
    percent % 1 === 0 ? `${percent.toFixed(0)}%` : `${percent.toFixed(1)}%`;

  return {
    count: String(count),
    percent: `(${formattedPercent})`
  };
}

export function getImpactPercentages(
  segments: { count: number }[]
): number[] {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  if (total <= 0) {
    return segments.map(() => 0);
  }

  return segments.map((segment) => (segment.count / total) * 100);
}
