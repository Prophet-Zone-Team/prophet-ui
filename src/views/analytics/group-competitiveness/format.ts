const MAX_COMPETITIVENESS_SCORE = 100;

export function formatGroupLabel(groupId: string): string {
  return `Group ${groupId}`;
}

export function formatCompetitivenessScore(score: number): string {
  return `${score}/${MAX_COMPETITIVENESS_SCORE}`;
}

export function getCompetitivenessBarWidth(
  score: number,
  maxWidth = 146
): number {
  return Math.round((score / MAX_COMPETITIVENESS_SCORE) * maxWidth);
}
