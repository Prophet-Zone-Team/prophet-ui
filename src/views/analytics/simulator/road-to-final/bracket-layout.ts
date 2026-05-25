export const BRACKET_SLOT_WIDTH = 68;
export const BRACKET_SLOT_HEIGHT = 30;
export const BRACKET_R16_GAP = 20;

/** Fork + stub width from the two final slots before the trophy leg. */
export const BRACKET_FINAL_FORK_WIDTH = 10;
export const BRACKET_TROPHY_LINE_WIDTH = 20;
/** Short vertical segment where the horizontal leg meets the trophy. */
export const BRACKET_TROPHY_VERTICAL_SPAN = 12;
export const BRACKET_TROPHY_GAP = 8;
export const BRACKET_TROPHY_IMAGE_WIDTH = 45;
export const BRACKET_TROPHY_IMAGE_HEIGHT = 85;

export function finalConnectorWidth(): number {
  return BRACKET_FINAL_FORK_WIDTH + BRACKET_TROPHY_LINE_WIDTH;
}

export function finalColumnWidth(): number {
  return (
    BRACKET_SLOT_WIDTH +
    finalConnectorWidth() +
    BRACKET_TROPHY_GAP +
    BRACKET_TROPHY_IMAGE_WIDTH
  );
}

export const BRACKET_ROUND_SLOT_COUNTS = {
  r16: 16,
  qf: 8,
  sf: 4,
  final: 2
} as const;

export function slotCenterFromTop(top: number): number {
  return top + BRACKET_SLOT_HEIGHT / 2;
}

export function slotTopFromCenter(center: number): number {
  return center - BRACKET_SLOT_HEIGHT / 2;
}

export function mergeCenter(a: number, b: number): number {
  return (a + b) / 2;
}

export function r16SlotTop(index: number): number {
  return index * (BRACKET_SLOT_HEIGHT + BRACKET_R16_GAP);
}

export function r16BracketHeight(): number {
  const { r16 } = BRACKET_ROUND_SLOT_COUNTS;
  return r16 * BRACKET_SLOT_HEIGHT + (r16 - 1) * BRACKET_R16_GAP;
}

export function r16SlotCenter(index: number): number {
  return slotCenterFromTop(r16SlotTop(index));
}

/** Each pair of feeders merges into one slot in the next round. */
export function mergedSlotTop(feederCenters: [number, number]): number {
  return slotTopFromCenter(mergeCenter(feederCenters[0], feederCenters[1]));
}

export function qfSlotTop(index: number): number {
  return mergedSlotTop([
    r16SlotCenter(index * 2),
    r16SlotCenter(index * 2 + 1)
  ]);
}

export function sfSlotTop(index: number): number {
  return mergedSlotTop([
    slotCenterFromTop(qfSlotTop(index * 2)),
    slotCenterFromTop(qfSlotTop(index * 2 + 1))
  ]);
}

export function finalSlotTop(index: number): number {
  return mergedSlotTop([
    slotCenterFromTop(sfSlotTop(index * 2)),
    slotCenterFromTop(sfSlotTop(index * 2 + 1))
  ]);
}

export function finalMatchCenter(): number {
  return mergeCenter(
    slotCenterFromTop(finalSlotTop(0)),
    slotCenterFromTop(finalSlotTop(1))
  );
}

export function buildSlotTops(
  round: keyof typeof BRACKET_ROUND_SLOT_COUNTS
): number[] {
  const count = BRACKET_ROUND_SLOT_COUNTS[round];
  const calculators: Record<
    keyof typeof BRACKET_ROUND_SLOT_COUNTS,
    (index: number) => number
  > = {
    r16: r16SlotTop,
    qf: qfSlotTop,
    sf: sfSlotTop,
    final: finalSlotTop
  };

  return Array.from({ length: count }, (_, index) => calculators[round](index));
}

export function buildFinalTrophyConnectorSpec(): {
  sourceCenters: [number, number];
  targetCenter: number;
} {
  return {
    sourceCenters: [
      slotCenterFromTop(finalSlotTop(0)),
      slotCenterFromTop(finalSlotTop(1))
    ],
    targetCenter: finalMatchCenter()
  };
}

export function buildPairConnectorSpecs(
  feederRound: "r16" | "qf" | "sf",
  targetRound: "qf" | "sf" | "final"
): Array<{
  sourceCenters: [number, number];
  targetCenter: number;
}> {
  const feederTops = buildSlotTops(feederRound);
  const targetTops = buildSlotTops(targetRound);
  const pairCount = targetTops.length;

  return Array.from({ length: pairCount }, (_, pairIndex) => ({
    sourceCenters: [
      slotCenterFromTop(feederTops[pairIndex * 2] ?? 0),
      slotCenterFromTop(feederTops[pairIndex * 2 + 1] ?? 0)
    ] as [number, number],
    targetCenter: slotCenterFromTop(targetTops[pairIndex] ?? 0)
  }));
}
