import type { CopyTarget } from "@/types/copy-trade-api";

export function isCopyTargetTotalCapReached(target: CopyTarget): boolean {
  return target.MaxUSDTotal > 0 && target.UsedUSDTotal >= target.MaxUSDTotal;
}

export function getCopyTargetTotalCapUsage(
  target: CopyTarget
): { used: number; max: number } | null {
  if (target.MaxUSDTotal <= 0) {
    return null;
  }

  return {
    used: target.UsedUSDTotal,
    max: target.MaxUSDTotal
  };
}
