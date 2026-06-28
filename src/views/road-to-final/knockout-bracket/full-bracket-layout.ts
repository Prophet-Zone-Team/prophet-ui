export const R32_MATCH_CARD_WIDTH = 148;
export const R32_MATCH_CARD_HEIGHT = 86;
export const INNER_MATCH_CARD_WIDTH = 132;
export const INNER_MATCH_CARD_HEIGHT = 86;
export const FINAL_MATCH_CARD_WIDTH = 182;
export const FINAL_MATCH_CARD_HEIGHT = 118;

export const TEAM_CHIP_HEIGHT = 26;
export const BRACKET_R32_GAP = 20;
export const BRACKET_INNER_GAP = 20;

export const CONNECTOR_WIDTH = {
  "r32-r16": 32,
  "r16-qf": 32,
  "qf-sf": 32,
  "sf-final": 32
} as const;

export const COLUMN_GAP = 0;

export const BRACKET_TROPHY_IMAGE_WIDTH = 45;
export const BRACKET_TROPHY_IMAGE_HEIGHT = 85;
export const BRACKET_TROPHY_GAP = 8;
export const BRACKET_FINAL_FORK_WIDTH = 10;
export const BRACKET_TROPHY_LINE_WIDTH = 20;
export const BRACKET_TROPHY_VERTICAL_SPAN = 12;

export function finalConnectorWidth(): number {
  return BRACKET_FINAL_FORK_WIDTH + BRACKET_TROPHY_LINE_WIDTH;
}

export function finalColumnWidth(): number {
  return FINAL_MATCH_CARD_WIDTH;
}

export function slotCenterFromTop(top: number, height = TEAM_CHIP_HEIGHT): number {
  return top + height / 2;
}

export function mergeCenter(a: number, b: number): number {
  return (a + b) / 2;
}

export function r32PairTop(index: number): number {
  return index * (R32_MATCH_CARD_HEIGHT + BRACKET_R32_GAP);
}

export function r32PairCenter(index: number): number {
  return slotCenterFromTop(r32PairTop(index), R32_MATCH_CARD_HEIGHT);
}

export function r32BracketHeight(): number {
  return 8 * R32_MATCH_CARD_HEIGHT + 7 * BRACKET_R32_GAP;
}

export function mergedCardTop(feederCenters: [number, number], cardHeight: number): number {
  return mergeCenter(feederCenters[0], feederCenters[1]) - cardHeight / 2;
}

export function r16MatchTop(index: number): number {
  return mergedCardTop(
    [r32PairCenter(index * 2), r32PairCenter(index * 2 + 1)],
    INNER_MATCH_CARD_HEIGHT
  );
}

export function r16MatchCenter(index: number): number {
  return mergeCenter(
    r32PairCenter(index * 2),
    r32PairCenter(index * 2 + 1)
  );
}

export function qfMatchTop(index: number): number {
  return mergedCardTop(
    [r16MatchCenter(index * 2), r16MatchCenter(index * 2 + 1)],
    INNER_MATCH_CARD_HEIGHT
  );
}

export function qfMatchCenter(index: number): number {
  return mergeCenter(
    r16MatchCenter(index * 2),
    r16MatchCenter(index * 2 + 1)
  );
}

export function sfMatchTop(index: number): number {
  return mergedCardTop(
    [qfMatchCenter(index * 2), qfMatchCenter(index * 2 + 1)],
    INNER_MATCH_CARD_HEIGHT
  );
}

export function sfMatchCenter(index: number): number {
  return mergeCenter(
    qfMatchCenter(index * 2),
    qfMatchCenter(index * 2 + 1)
  );
}

export function finalMatchTop(): number {
  return sfMatchCenter(0) - FINAL_MATCH_CARD_HEIGHT / 2;
}

export function finalMatchCenter(): number {
  return sfMatchCenter(0);
}

export function buildMatchTopsForSide(
  round: "r32" | "r16" | "qf" | "sf",
  count: number
): number[] {
  const calculators: Record<
    "r32" | "r16" | "qf" | "sf",
    (index: number) => number
  > = {
    r32: r32PairTop,
    r16: r16MatchTop,
    qf: qfMatchTop,
    sf: sfMatchTop
  };

  return Array.from({ length: count }, (_, index) => calculators[round](index));
}

export function buildMatchCentersForSide(
  round: "r32" | "r16" | "qf" | "sf",
  count: number
): number[] {
  const calculators: Record<
    "r32" | "r16" | "qf" | "sf",
    (index: number) => number
  > = {
    r32: r32PairCenter,
    r16: r16MatchCenter,
    qf: qfMatchCenter,
    sf: sfMatchCenter
  };

  return Array.from({ length: count }, (_, index) => calculators[round](index));
}

export function buildPairConnectorSpecs(
  feederCenters: number[],
  targetCenters: number[]
): Array<{
  sourceCenters: [number, number];
  targetCenter: number;
  pairIndex: number;
}> {
  const pairCount = targetCenters.length;

  return Array.from({ length: pairCount }, (_, pairIndex) => ({
    sourceCenters: [
      feederCenters[pairIndex * 2] ?? 0,
      feederCenters[pairIndex * 2 + 1] ?? 0
    ] as [number, number],
    targetCenter: targetCenters[pairIndex] ?? 0,
    pairIndex
  }));
}

export function buildFinalTrophyConnectorSpec(): {
  sourceCenters: [number, number];
  targetCenter: number;
} {
  const top0 = finalMatchTop();
  const top1 = finalMatchTop();
  const slot0Center = top0 + TEAM_CHIP_HEIGHT / 2 + 8;
  const slot1Center = top0 + FINAL_MATCH_CARD_HEIGHT - TEAM_CHIP_HEIGHT / 2 - 8;

  return {
    sourceCenters: [slot0Center, slot1Center],
    targetCenter: finalMatchCenter()
  };
}

export function columnWidth(round: "r32" | "r16" | "qf" | "sf" | "final"): number {
  if (round === "final") {
    return finalColumnWidth();
  }

  if (round === "r32") {
    return R32_MATCH_CARD_WIDTH;
  }

  return INNER_MATCH_CARD_WIDTH;
}
