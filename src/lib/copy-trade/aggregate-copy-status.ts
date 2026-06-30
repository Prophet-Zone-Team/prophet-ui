import type { CopyTarget } from "@/types/copy-trade-api";

export type CopyTradeAggregateStatus = "na" | "running" | "paused";

export function resolveCopyTradeAggregateStatus(
  targets: CopyTarget[]
): CopyTradeAggregateStatus {
  if (targets.length === 0) {
    return "na";
  }

  if (targets.some((target) => target.Enabled)) {
    return "running";
  }

  return "paused";
}
