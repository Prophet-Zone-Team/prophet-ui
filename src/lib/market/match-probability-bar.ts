/** Divider leans right: top split is further right than bottom (degrees from horizontal). */
export const SLANT_ANGLE_DEGREES = 60;

export interface MatchOutcomeProbabilities {
  home: number;
  draw: number;
  away: number;
}

export function getSlantOffsetPx(height: number, width?: number): number {
  const radians = (SLANT_ANGLE_DEGREES * Math.PI) / 180;
  const raw = height / Math.tan(radians);

  if (width !== undefined) {
    return Math.min(raw, width * 0.22);
  }

  return raw;
}

export function buildProbabilityClips(
  probabilities: MatchOutcomeProbabilities,
  slant: number
) {
  const homeEnd = probabilities.home * 100;
  const drawEnd = (probabilities.home + probabilities.draw) * 100;

  const homeClip = `polygon(0 0, calc(${homeEnd}% + ${slant}px) 0, ${homeEnd}% 100%, 0 100%)`;
  const drawClip = `polygon(calc(${homeEnd}% + ${slant}px) 0, calc(${drawEnd}% + ${slant}px) 0, ${drawEnd}% 100%, ${homeEnd}% 100%)`;
  const awayClip = `polygon(calc(${drawEnd}% + ${slant}px) 0, 100% 0, 100% 100%, ${drawEnd}% 100%)`;

  return { homeClip, drawClip, awayClip, homeEnd, drawEnd };
}
